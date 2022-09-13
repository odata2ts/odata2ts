import { QBooleanParam } from "../../../src";

describe("QBooleanParam Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QBooleanParam(name);

  test("QBooleanParam: base attributes", () => {
    expect(toTest.getName()).toBe(name);
  });

  test("QBooleanParam: formatUrlValue", () => {
    expect(toTest.formatUrlValue(true)).toBe("true");
    expect(toTest.formatUrlValue(false)).toBe("false");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);
  });

  test("QBooleanParam: parseUrlValue", () => {
    expect(toTest.parseUrlValue("true")).toBe(true);
    expect(toTest.parseUrlValue("false")).toBe(false);
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);
  });

  test("QBooleanParam: fail creation", () => {
    // @ts-expect-error
    expect(() => new QBooleanParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QBooleanParam(null)).toThrowError();
  });

  test("QBooleanParam: convertFrom", () => {});
});
