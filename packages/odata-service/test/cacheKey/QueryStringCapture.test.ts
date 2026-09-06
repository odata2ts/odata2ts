import { ODataHttpMethods } from "@odata2ts/http-client-api";
import { describe, expect, test } from "vitest";
import { canonicalizeQueryString, captureQueryString } from "../../src/cacheKey";

describe("captureQueryString", () => {
  test("no query string in the URL: undefined", () => {
    expect(captureQueryString(ODataHttpMethods.Get, "https://svc/Media", undefined)).toBeUndefined();
  });

  test("ordinary GET: everything after '?'", () => {
    expect(captureQueryString(ODataHttpMethods.Get, "https://svc/Media?$top=10&$select=Title", undefined)).toBe(
      "$top=10&$select=Title",
    );
  });

  test("GetToPostConverter case: POST + '/$query' suffix reads the body verbatim, not the URL", () => {
    expect(
      captureQueryString(
        ODataHttpMethods.Post,
        "https://svc/Media/$query",
        "$filter=Title eq 'a very long value that pushed this over the URL length limit'",
      ),
    ).toBe("$filter=Title eq 'a very long value that pushed this over the URL length limit'");
  });

  test("an ordinary POST with no '/$query' suffix is not mistaken for the converted case", () => {
    expect(captureQueryString(ODataHttpMethods.Post, "https://svc/Media", { title: "x" })).toBeUndefined();
  });

  test("a '/$query'-suffixed URL on a non-POST method is not mistaken for the converted case", () => {
    // defensive - should never happen in practice, since GetToPostConverter always emits POST
    expect(captureQueryString(ODataHttpMethods.Get, "https://svc/Media/$query?a=1", undefined)).toBe("a=1");
  });
});

describe("canonicalizeQueryString", () => {
  test("a single pair round-trips, re-encoded", () => {
    expect(canonicalizeQueryString("$top=10")).toBe("%24top=10");
  });

  test("pairs are reordered by key, so differently-ordered query strings converge", () => {
    expect(canonicalizeQueryString("$top=10&$skip=5")).toBe(canonicalizeQueryString("$skip=5&$top=10"));
    expect(canonicalizeQueryString("$top=10&$skip=5")).toBe("%24skip=5&%24top=10");
  });

  test("same-key duplicates keep their original relative order - only the keys get sorted, never the values", () => {
    expect(canonicalizeQueryString("custom=z&custom=a&$top=10")).toBe("%24top=10&custom=z&custom=a");
  });

  test("$select/$filter/$search are stripped - captured structurally elsewhere, with no loss of information", () => {
    expect(canonicalizeQueryString("$select=Title&$filter=Id eq 1&$search=x&$top=10")).toBe("%24top=10");
  });

  test("nothing left after stripping means undefined, not an empty string", () => {
    expect(canonicalizeQueryString("$select=Title")).toBeUndefined();
  });

  test("$orderBy is never stripped or reordered - its own sequence is real, result-changing content", () => {
    expect(canonicalizeQueryString("$orderby=Name asc,Age desc")).toBe("%24orderby=Name+asc%2CAge+desc");
  });

  test("$expand is never stripped, unlike $select/$filter/$search - its structured entry is deliberately narrower than its full text (no nested restriction), so the raw text has to survive here or a nested restriction's identity is lost", () => {
    expect(canonicalizeQueryString("$expand=Copies($filter=Condition eq 3)")).toBe(
      "%24expand=Copies%28%24filter%3DCondition+eq+3%29",
    );
    // proof this matters: two different nested restrictions must not canonicalize to the same string
    expect(canonicalizeQueryString("$expand=Copies($filter=Condition eq 3)")).not.toBe(
      canonicalizeQueryString("$expand=Copies($filter=Condition eq 5)"),
    );
  });
});
