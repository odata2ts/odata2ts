import { QBooleanParam } from "../../../src";
import { fixedBooleanConverter } from "../../fixture/converter/FixedBooleanConverter";

describe("QBooleanParam Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QBooleanParam(name);
  const toTestWithConverter = new QBooleanParam(name, undefined, fixedBooleanConverter);

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
    expect(toTestWithConverter.convertFrom(true)).toBe(1);
    expect(toTestWithConverter.convertTo(1)).toBe(true);

    expect(toTestWithConverter.convertFrom(null)).toBe(0);
    expect(toTestWithConverter.convertTo(null)).toBe(false);
    expect(toTestWithConverter.convertTo(undefined)).toBe(false);
  });

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue(true)).toBe("true");
    expect(toTest.formatUrlValue(false)).toBe("false");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.formatUrlValue(1)).toBe("true");
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("true")).toBe(true);
    expect(toTest.parseUrlValue("false")).toBe(false);
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.parseUrlValue("false")).toBe(0);
  });
});
