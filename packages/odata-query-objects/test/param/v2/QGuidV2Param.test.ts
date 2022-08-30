import { QGuidV2Param } from "../../../src";

describe("QGuidV2Param Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QGuidV2Param(name);

  test("QGuidV2Param: base attributes", () => {
    expect(toTest.getName()).toBe(name);
  });

  test("QGuidV2Param: formatUrlValue", () => {
    expect(toTest.formatUrlValue("test")).toBe("guid'test'");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);
  });

  test("QGuidV2Param: parseUrlValue", () => {
    expect(toTest.parseUrlValue("guid'test'")).toBe("test");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);
  });

  test("QGuidV2Param: fail creation", () => {
    // @ts-expect-error
    expect(() => new QGuidV2Param()).toThrowError();
    // @ts-expect-error
    expect(() => new QGuidV2Param(null)).toThrowError();
  });
});
