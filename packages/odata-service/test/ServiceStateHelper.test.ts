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

  test("getDefaultHeaders: a configured version is announced on every request", () => {
    // Reads included, and that is the point: the version governs the shape of the *response* as well, so a
    // client generated for 4.01 has to declare it on a GET too - otherwise the service answers in 4.0 form
    // and the short-form control information the generated response models are typed for never arrives.
    expect(
      new ServiceStateHelper(client, "base", "name", { odataVersionV4: "4.01" }).getDefaultHeaders(),
    ).toStrictEqual({ ...DEFAULT_HEADERS, "OData-Version": "4.01" });
    expect(
      new ServiceStateHelper(client, "base", "name", {
        odataVersionV4: "4.01",
        bigNumbersAsString: true,
      }).getDefaultHeaders(),
    ).toStrictEqual({ ...BIG_NUMBERS_HEADERS, "OData-Version": "4.01" });
  });

  test("getDefaultHeaders: nothing is announced where no version was configured", () => {
    // This helper is shared with V2, where an `OData-Version: 4.x` header would be plainly wrong - and it
    // cannot tell that apart from a V4 service left on the 4.0 default, since the generator writes the
    // option only for 4.01. So the header follows what was configured, not a fallback.
    expect(new ServiceStateHelper(client, "base", "name").getDefaultHeaders()).not.toHaveProperty("OData-Version");
  });

  test("getVersionHeaders: a request with a body always states a version", () => {
    // Unlike the default headers this falls back to 4.0, because there the header governs how the service
    // reads the payload - and the notations we generate are only valid under a declared version.
    expect(new ServiceStateHelper(client, "base", "name").getVersionHeaders()).toStrictEqual({
      "OData-Version": "4.0",
    });
    expect(
      new ServiceStateHelper(client, "base", "name", { odataVersionV4: "4.01" }).getVersionHeaders(),
    ).toStrictEqual({ "OData-Version": "4.01" });
  });

  test("isUrlNotEncoded", () => {
    expect(new ServiceStateHelper(client, "base").isUrlNotEncoded()).toBe(false);
    expect(new ServiceStateHelper(client, "base", "name", { noUrlEncoding: true }).isUrlNotEncoded()).toBe(true);
  });
});
