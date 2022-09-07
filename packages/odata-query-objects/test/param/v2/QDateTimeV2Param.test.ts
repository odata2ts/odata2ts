import { QDateTimeV2Param } from "../../../src";

describe("QDateTimeV2Param Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QDateTimeV2Param(name);

  test("QDateTimeV2Param: base attributes", () => {
    expect(toTest.getName()).toBe(name);
  });

  test("QDateTimeV2Param: formatUrlValue", () => {
    expect(toTest.formatUrlValue("test")).toBe("datetime'test'");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);
  });

  test("QDateTimeV2Param: parseUrlValue", () => {
    expect(toTest.parseUrlValue("datetime'test'")).toBe("test");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);
  });

  test("QDateTimeV2Param: fail creation", () => {
    // @ts-expect-error
    expect(() => new QDateTimeV2Param()).toThrowError();
    // @ts-expect-error
    expect(() => new QDateTimeV2Param(null)).toThrowError();
  });
});
