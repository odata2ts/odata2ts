import { QNumberParam } from "../../../src";

describe("QNumberParam Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QNumberParam(name);

  test("QNumberParam: base attributes", () => {
    expect(toTest.getName()).toBe(name);
  });

  test("QNumberParam: formatUrlValue", () => {
    expect(toTest.formatUrlValue(33)).toBe("33");
    expect(toTest.formatUrlValue(-33.1233)).toBe("-33.1233");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);
  });

  test("QNumberParam: parseUrlValue", () => {
    expect(toTest.parseUrlValue("-33.1233")).toBe(-33.1233);
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);
  });

  test("QNumberParam: fail creation", () => {
    // @ts-expect-error
    expect(() => new QNumberParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QNumberParam(null)).toThrowError();
  });
});
