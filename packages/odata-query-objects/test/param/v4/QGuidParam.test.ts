import { FIXED_DATE, FIXED_STRING, fixedDateConverter } from "@odata2ts/test-converters";

import { QGuidParam } from "../../../src";

describe("QGuidParam Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QGuidParam(name);
  const toTestWithConverter = new QGuidParam(name, undefined, fixedDateConverter);

  test("base attributes", () => {
    expect(toTest.getName()).toBe(name);
    expect(toTest.getMappedName()).toBe(name);
    expect(toTest.getConverter()).toBeDefined();
  });

  test("fail creation", () => {
    // @ts-expect-error
    expect(() => new QGuidParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QGuidParam(null)).toThrowError();
  });

  test("mapped name", () => {
    const test = new QGuidParam(name, "xxx");

    expect(test.getName()).toBe(name);
    expect(test.getMappedName()).toBe("xxx");
  });

  test("converter", () => {
    expect(toTestWithConverter.convertFrom("Tester")).toBe(FIXED_DATE);
    expect(toTestWithConverter.convertTo(new Date())).toBe(FIXED_STRING);
  });

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue("test")).toBe("test");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.formatUrlValue(new Date())).toBe(FIXED_STRING);
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("test")).toBe("test");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.parseUrlValue("any")).toBe(FIXED_DATE);
  });
});
