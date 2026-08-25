import { describe, expect, test } from "vitest";
import { isConcurrencyConflict, isConcurrencyRequired, ODataConcurrencyError } from "../src/ODataConcurrencyError";

describe("ODataConcurrencyError", () => {
  test("names the resource and the ways forward", () => {
    const error = new ODataConcurrencyError("/svc/Copies(1)");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ODataConcurrencyError");
    expect(error.resource).toBe("/svc/Copies(1)");
    expect(error.message).toContain("/svc/Copies(1)");
    expect(error.message).toContain("withETag");
    expect(error.message).toContain("ignoreETag");
  });
});

describe("isConcurrencyConflict", () => {
  test("412 is a conflict", () => {
    expect(isConcurrencyConflict({ name: "FetchClientError", status: 412 })).toBe(true);
  });

  test("nothing else is", () => {
    expect(isConcurrencyConflict({ name: "FetchClientError", status: 428 })).toBe(false);
    expect(isConcurrencyConflict({ name: "FetchClientError", status: 404 })).toBe(false);
    expect(isConcurrencyConflict({ name: "FetchClientError" })).toBe(false);
    expect(isConcurrencyConflict(new Error("boom"))).toBe(false);
    expect(isConcurrencyConflict(undefined)).toBe(false);
    expect(isConcurrencyConflict(null)).toBe(false);
    expect(isConcurrencyConflict("412")).toBe(false);
  });
});

describe("isConcurrencyRequired", () => {
  test("428 says the service demands an ETag", () => {
    expect(isConcurrencyRequired({ name: "AxiosClientError", status: 428 })).toBe(true);
  });

  test("nothing else is", () => {
    expect(isConcurrencyRequired({ name: "AxiosClientError", status: 412 })).toBe(false);
    expect(isConcurrencyRequired(null)).toBe(false);
    expect(isConcurrencyRequired(new ODataConcurrencyError("/svc/Copies(1)"))).toBe(false);
  });
});
