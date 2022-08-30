import { QStringParam } from "../../../src";

describe("QStringParam Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QStringParam(name);

  test("QStringParam: base attributes", () => {
    expect(toTest.getName()).toBe(name);
  });

  test("QStringParam: formatUrlValue", () => {
    expect(toTest.formatUrlValue("Te3st")).toBe("'Te3st'");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);
  });

  test("QStringParam: parseUrlValue", () => {
    expect(toTest.parseUrlValue("'Te3st'")).toBe("Te3st");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);
  });

  test("QStringParam: fail creation", () => {
    // @ts-expect-error
    expect(() => new QStringParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QStringParam(null)).toThrowError();
  });
});
