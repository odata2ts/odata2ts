import { describe, expect, test } from "vitest";
import { BIG_NUMBERS_HEADERS, DEFAULT_HEADERS } from "../src/RequestHeaders.js";
import { ServiceStateHelper } from "../src/ServiceStateHelper";
import { MockClient } from "./mock/MockClient";

describe("ServiceStateHelper tests", () => {
  const client = new MockClient(false);

  // Note: addFullPath()'s `this.path ?? ""` fallback is structurally unreachable — `path` is a required,
  // readonly string field that the constructor always assigns a string to (falling back to `name || ""` in the
  // worst case), so it can never be null/undefined. Not tested here.

  test("path: basePath and name given", () => {
    const helper = new ServiceStateHelper(client, "base", "name");
    expect(helper.path).toBe("base/name");
  });

  test("path: only basePath given", () => {
    const helper = new ServiceStateHelper(client, "base");
    expect(helper.path).toBe("base");
  });

  test("path: only name given", () => {
    const helper = new ServiceStateHelper(client, "", "name");
    expect(helper.path).toBe("name");
  });

  test("path: neither basePath nor name given", () => {
    const helper = new ServiceStateHelper(client, "");
    expect(helper.path).toBe("");
  });

  test("getDefaultHeaders", () => {
    expect(new ServiceStateHelper(client, "base", "name").getDefaultHeaders()).toStrictEqual(DEFAULT_HEADERS);
    expect(
      new ServiceStateHelper(client, "base", "name", { bigNumbersAsString: true }).getDefaultHeaders(),
    ).toStrictEqual(BIG_NUMBERS_HEADERS);
  });

  test("isUrlNotEncoded", () => {
    expect(new ServiceStateHelper(client, "base").isUrlNotEncoded()).toBe(false);
    expect(new ServiceStateHelper(client, "base", "name", { noUrlEncoding: true }).isUrlNotEncoded()).toBe(true);
  });
});
