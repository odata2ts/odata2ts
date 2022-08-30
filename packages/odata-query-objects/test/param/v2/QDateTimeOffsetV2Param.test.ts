import { QDateTimeOffsetV2Param } from "../../../src";

describe("QDateTimeOffsetV2Param Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QDateTimeOffsetV2Param(name);

  test("QDateTimeOffsetV2Param: base attributes", () => {
    expect(toTest.getName()).toBe(name);
  });

  test("QDateTimeOffsetV2Param: formatUrlValue", () => {
    expect(toTest.formatUrlValue("test")).toBe("datetimeoffset'test'");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);
  });

  test("QDateTimeOffsetV2Param: parseUrlValue", () => {
    expect(toTest.parseUrlValue("datetimeoffset'test'")).toBe("test");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);
  });

  test("QDateTimeOffsetV2Param: fail creation", () => {
    // @ts-expect-error
    expect(() => new QDateTimeOffsetV2Param()).toThrowError();
    // @ts-expect-error
    expect(() => new QDateTimeOffsetV2Param(null)).toThrowError();
  });
});
