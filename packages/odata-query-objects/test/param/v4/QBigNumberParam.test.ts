import { stringToPrefixModelConverter } from "@odata2ts/test-converters";

import { QBigNumberParam, QNumberParam } from "../../../src";

describe("QBigNumberParam Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QBigNumberParam(name);
  const toTestWithConverter = new QBigNumberParam(name, undefined, stringToPrefixModelConverter);

  test("base attributes", () => {
    expect(toTest.getName()).toBe(name);
    expect(toTest.getMappedName()).toBe(name);
    expect(toTest.getConverter()).toBeDefined();
  });

  test("fail creation", () => {
    // @ts-expect-error
    expect(() => new QBigNumberParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QBigNumberParam(null)).toThrowError();
  });

  test("mapped name", () => {
    const test = new QBigNumberParam(name, "myTest");
    expect(test.getName()).toBe(name);
    expect(test.getMappedName()).toBe("myTest");
  });

  test("converter", () => {
    const value = "23.5";
    const withPrefix = { prefix: "PREFIX_", value };
    expect(toTestWithConverter.convertFrom(value)).toStrictEqual(withPrefix);
    expect(toTestWithConverter.convertTo(withPrefix)).toBe(value);
  });

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue("33")).toBe("33");
    expect(toTest.formatUrlValue("-33.1233")).toBe("-33.1233");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.formatUrlValue({ prefix: "p", value: "33" })).toBe("33");
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("-33.1233")).toBe("-33.1233");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.parseUrlValue("-33.1233")).toStrictEqual({ prefix: "PREFIX_", value: "-33.1233" });
  });
});
