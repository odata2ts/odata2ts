import { QTimeV2Param } from "../../../src";

describe("QTimeV2Param Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QTimeV2Param(name);

  test("QTimeV2Param: base attributes", () => {
    expect(toTest.getName()).toBe(name);
  });

  test("QTimeV2Param: formatUrlValue", () => {
    expect(toTest.formatUrlValue("test")).toBe("time'test'");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);
  });

  test("QTimeV2Param: parseUrlValue", () => {
    expect(toTest.parseUrlValue("time'test'")).toBe("test");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);
  });

  test("QTimeV2Param: fail creation", () => {
    // @ts-expect-error
    expect(() => new QTimeV2Param()).toThrowError();
    // @ts-expect-error
    expect(() => new QTimeV2Param(null)).toThrowError();
  });
});
