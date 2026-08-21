import { describe, expect, test } from "vitest";
import { getBodyETagV2, getBodyETagV4, getHeaderETag } from "../src/ETagExtraction";

describe("getBodyETagV4", () => {
  test("the 4.0 spelling", () => {
    expect(getBodyETagV4({ "@odata.etag": 'W/"1"' })).toBe('W/"1"');
  });

  test("the 4.01 short form", () => {
    expect(getBodyETagV4({ "@etag": 'W/"1"' })).toBe('W/"1"');
  });

  test("the prefixed form wins where a payload carries both", () => {
    expect(getBodyETagV4({ "@odata.etag": 'W/"long"', "@etag": 'W/"short"' })).toBe('W/"long"');
  });

  test("nothing to read", () => {
    expect(getBodyETagV4(undefined)).toBeUndefined();
    expect(getBodyETagV4(null)).toBeUndefined();
    expect(getBodyETagV4({})).toBeUndefined();
    expect(getBodyETagV4({ Id: 1, Name: "no etag here" })).toBeUndefined();
  });

  test("the V2 form is none of its business", () => {
    expect(getBodyETagV4({ __metadata: { etag: 'W/"1"' } })).toBeUndefined();
  });
});

describe("getBodyETagV2", () => {
  test("the V2 form", () => {
    expect(getBodyETagV2({ __metadata: { etag: 'W/"1"' } })).toBe('W/"1"');
  });

  test("nothing to read", () => {
    expect(getBodyETagV2(undefined)).toBeUndefined();
    expect(getBodyETagV2(null)).toBeUndefined();
    expect(getBodyETagV2({})).toBeUndefined();
    expect(getBodyETagV2({ __metadata: {} })).toBeUndefined();
  });

  test("the V4 forms are none of its business", () => {
    // a V2 service whose responses were reshaped as V4 reaches for the V4 reader instead
    expect(getBodyETagV2({ "@odata.etag": 'W/"1"' })).toBeUndefined();
  });
});

describe("getHeaderETag", () => {
  test("lower case, as every odata2ts client hands them over", () => {
    expect(getHeaderETag({ etag: 'W/"1"' })).toBe('W/"1"');
  });

  test("the original casing is accepted too", () => {
    expect(getHeaderETag({ ETag: 'W/"1"' })).toBe('W/"1"');
  });

  test("nothing to read", () => {
    expect(getHeaderETag()).toBeUndefined();
    expect(getHeaderETag({})).toBeUndefined();
    expect(getHeaderETag({ "content-type": "application/json" })).toBeUndefined();
  });
});
