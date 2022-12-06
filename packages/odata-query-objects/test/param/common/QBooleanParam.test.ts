import { booleanToNumberConverter } from "@odata2ts/test-converters";

import { QBooleanParam } from "../../../src";

describe("QBooleanParam Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QBooleanParam(name);
  const toTestWithConverter = new QBooleanParam(name, undefined, booleanToNumberConverter);

  test("base attributes", () => {
    expect(toTest.getName()).toBe(name);
    expect(toTest.getMappedName()).toBe(name);
    expect(toTest.getConverter()).toBeDefined();
  });

  test("fail creation", () => {
    // @ts-expect-error
    expect(() => new QBooleanParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QBooleanParam(null)).toThrowError();
  });

  test("mapped name", () => {
    const test = new QBooleanParam(name, "myTest");
    expect(test.getName()).toBe(name);
    expect(test.getMappedName()).toBe("myTest");
  });

  test("converter", () => {
    expect(toTestWithConverter.convertFrom(false)).toBe(0);
    expect(toTestWithConverter.convertTo(1)).toBe(true);

    // collections
    expect(toTestWithConverter.convertFrom([false, true])).toStrictEqual([0, 1]);
    expect(toTestWithConverter.convertTo([0, 1])).toStrictEqual([false, true]);

    // identity converter
    expect(toTest.convertFrom(true)).toBe(true);
    expect(toTest.convertTo(true)).toBe(true);
    expect(toTest.convertFrom(null)).toBe(null);
    expect(toTest.convertTo(null)).toBe(null);
    expect(toTest.convertFrom(undefined)).toBe(undefined);
    expect(toTest.convertTo(undefined)).toBe(undefined);
  });

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue(true)).toBe("true");
    expect(toTest.formatUrlValue(false)).toBe("false");
    expect(toTest.formatUrlValue([true, false, true])).toBe("[true,false,true]");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.formatUrlValue(1)).toBe("true");
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("true")).toBe(true);
    expect(toTest.parseUrlValue("false")).toBe(false);
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue("test")).toBe(undefined);
    expect(toTest.parseUrlValue("[true, false, true]")).toStrictEqual([true, false, true]);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.parseUrlValue("false")).toBe(0);
  });
});
