import { ODataHttpMethods } from "@odata2ts/http-client-api";
import { beforeEach, describe, expect, test } from "vitest";
import { CacheKeyState, rootState, withKey } from "../../src/cacheKey";
import { RequestInfo, UrlGetRequestCmd, UrlWriteRequestCmd } from "../../src/request";
import { GetToPostConverter } from "../../src/request/RequestHelper";
import { MockClient } from "../mock/MockClient";

const MEDIUM = "Library.Catalog.Medium";

describe("cache key threading", () => {
  let client: MockClient;

  beforeEach(() => {
    client = new MockClient(false);
  });

  test("RequestInfo forwards the state through withData", () => {
    const state = rootState(MEDIUM, "list");
    const info = new RequestInfo(ODataHttpMethods.Get, "Media", undefined, undefined, state);
    expect(info.withData({ a: 1 }).cacheKeyState).toBe(state);
  });

  test("the key is undefined when no state was threaded", () => {
    expect(new UrlGetRequestCmd(client, "Media").cacheKey).toBeUndefined();
  });

  test("the key is built from the threaded state and the query params", () => {
    const cmd = new UrlGetRequestCmd(client, "Media?$top=10", {
      cacheKeyState: rootState(MEDIUM, "list"),
      queryParams: { top: 10 },
    });
    expect(cmd.cacheKey).toEqual([MEDIUM, "list", { top: 10 }]);
  });

  test("the getter is memoized", () => {
    const cmd = new UrlGetRequestCmd(client, "Media", { cacheKeyState: rootState(MEDIUM, "list") });
    expect(cmd.cacheKey).toBe(cmd.cacheKey);
  });

  test("GetToPostConverter leaves the key byte-for-byte identical", () => {
    const cmd = new UrlGetRequestCmd(client, "Media?$top=10", {
      cacheKeyState: rootState(MEDIUM, "list"),
      queryParams: { top: 10 },
    });
    const before = JSON.stringify(cmd.cacheKey);
    cmd.asPostRequest();
    expect(JSON.stringify(cmd.cacheKey)).toBe(before);
  });

  test("an appended converter that changes the state changes the key, with no extra call", () => {
    const cmd = new UrlGetRequestCmd(client, "Media", { cacheKeyState: rootState(MEDIUM, "list") });
    cmd.appendRequestConverter((request) => {
      return new RequestInfo(
        request.method,
        request.url,
        request.headers,
        request.data,
        withKey(request.cacheKeyState as CacheKeyState, 5, { Id: 5 }),
      );
    });
    expect(cmd.cacheKey).toEqual([MEDIUM, "detail", 5]);
  });

  test("two composed converters both take effect in order", () => {
    const cmd = new UrlGetRequestCmd(client, "Media", { cacheKeyState: rootState(MEDIUM, "list") });
    cmd.appendRequestConverter(
      (request) =>
        new RequestInfo(
          request.method,
          request.url,
          request.headers,
          request.data,
          withKey(request.cacheKeyState as CacheKeyState, 5, { Id: 5 }),
        ),
    );
    cmd.appendRequestConverter((request) => {
      const state = request.cacheKeyState as CacheKeyState;
      return new RequestInfo(request.method, request.url, request.headers, request.data, {
        ...state,
        params: { cast: "Library.Catalog.Book" },
      });
    });
    expect(cmd.cacheKey).toEqual([MEDIUM, "detail", 5, { cast: "Library.Catalog.Book" }]);
  });

  test("a write response carries invalidates", async () => {
    const cmd = new UrlWriteRequestCmd(
      client,
      ODataHttpMethods.Patch,
      "Media(5)",
      { title: "x" },
      {
        cacheKeyState: withKey(rootState(MEDIUM, "list"), 5, { Id: 5 }),
      },
    );
    const response = await cmd.execute();
    expect(response.invalidates).toEqual([
      [MEDIUM, "detail", 5],
      [MEDIUM, "list"],
    ]);
  });

  test("a read response carries no invalidates", async () => {
    const cmd = new UrlGetRequestCmd(client, "Media", { cacheKeyState: rootState(MEDIUM, "list") });
    const response = await cmd.execute();
    expect(response.invalidates).toBeUndefined();
  });

  test("no state means no invalidates on a write either", async () => {
    const cmd = new UrlWriteRequestCmd(client, ODataHttpMethods.Patch, "Media(5)", { title: "x" });
    const response = await cmd.execute();
    expect(response.invalidates).toBeUndefined();
  });

  test("a command with no state computes its (undefined) key once, not on every access", () => {
    // `undefined` is both "not computed yet" and the legitimate answer for a client generated without
    // `cacheKeys` - the memo must tell those apart, or every access re-runs the whole converter chain,
    // which for a write means re-converting the entire request payload on every read of `.cacheKey`.
    let calls = 0;
    const cmd = new UrlWriteRequestCmd(
      client,
      ODataHttpMethods.Patch,
      "Media(5)",
      { title: "x" },
      {
        mainRequestConverter: {
          convertToOData: (data: any) => {
            calls++;
            return data;
          },
        },
      },
    );

    expect(cmd.cacheKey).toBeUndefined();
    expect(cmd.cacheKey).toBeUndefined();
    expect(calls).toBe(1);
  });
});
