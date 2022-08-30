import { QDateTimeOffsetParam } from "../../../src";

describe("QDateTimeOffsetParam Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QDateTimeOffsetParam(name);

  test("QDateTimeOffsetParam: base attributes", () => {
    expect(toTest.getName()).toBe(name);
  });

  test("QDateTimeOffsetParam: formatUrlValue", () => {
    expect(toTest.formatUrlValue("test")).toBe("test");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);
  });

  test("QDateTimeOffsetParam: parseUrlValue", () => {
    expect(toTest.parseUrlValue("test")).toBe("test");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);
  });

  test("QDateTimeOffsetParam: fail creation", () => {
    // @ts-expect-error
    expect(() => new QDateTimeOffsetParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QDateTimeOffsetParam(null)).toThrowError();
  });
});
