import { QTimeOfDayParam } from "../../../src";

describe("QTimeOfDayParam Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QTimeOfDayParam(name);

  test("QTimeOfDayParam: base attributes", () => {
    expect(toTest.getName()).toBe(name);
  });

  test("QTimeOfDayParam: formatUrlValue", () => {
    expect(toTest.formatUrlValue("test")).toBe("test");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);
  });

  test("QTimeOfDayParam: parseUrlValue", () => {
    expect(toTest.parseUrlValue("test")).toBe("test");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);
  });

  test("QTimeOfDayParam: fail creation", () => {
    // @ts-expect-error
    expect(() => new QTimeOfDayParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QTimeOfDayParam(null)).toThrowError();
  });
});
