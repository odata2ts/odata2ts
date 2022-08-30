import { QGuidParam } from "../../../src";

describe("QGuidParam Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QGuidParam(name);

  test("QGuidParam: base attributes", () => {
    expect(toTest.getName()).toBe(name);
  });

  test("QGuidParam: formatUrlValue", () => {
    expect(toTest.formatUrlValue("test")).toBe("test");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);
  });

  test("QGuidParam: parseUrlValue", () => {
    expect(toTest.parseUrlValue("test")).toBe("test");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);
  });

  test("QGuidParam: fail creation", () => {
    // @ts-expect-error
    expect(() => new QGuidParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QGuidParam(null)).toThrowError();
  });
});
