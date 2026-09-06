import { ODataHttpMethods } from "@odata2ts/http-client-api";
import { describe, expect, test } from "vitest";
import { captureQueryString } from "../../src/cacheKey";

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
