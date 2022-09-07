import { QDateParam } from "../../../src";

describe("QDateParam Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QDateParam(name);

  test("QDateParam: base attributes", () => {
    expect(toTest.getName()).toBe(name);
  });

  test("QDateParam: formatUrlValue", () => {
    expect(toTest.formatUrlValue("test")).toBe("test");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);
  });

  test("QDateParam: parseUrlValue", () => {
    expect(toTest.parseUrlValue("test")).toBe("test");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);
  });

  test("QDateParam: fail creation", () => {
    // @ts-expect-error
    expect(() => new QDateParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QDateParam(null)).toThrowError();
  });
});
