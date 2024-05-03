import { stringToPrefixModelConverter } from "@odata2ts/test-converters";

import { QBinaryParam, QBinaryV2Param } from "../../../src";

describe("QBinary Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QBinaryParam(name);
  const toTestWithConverter = new QBinaryParam(name, undefined, stringToPrefixModelConverter);

  test("base attributes", () => {
    expect(toTest.getName()).toBe(name);
    expect(toTest.getMappedName()).toBe(name);
    expect(toTest.getConverter()).toBeDefined();
  });

  test("fail creation", () => {
    // @ts-expect-error
    expect(() => new QBinaryParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QBinaryParam(null)).toThrowError();
  });

  test("mapped name", () => {
    const mappedName = "xxx";
    const test = new QBinaryParam(name, mappedName);

    expect(test.getName()).toBe(name);
    expect(test.getMappedName()).toBe(mappedName);
  });

  test("converter", () => {
    expect(toTestWithConverter.convertFrom("Tester")).toStrictEqual({ prefix: "PREFIX_", value: "Tester" });
    expect(toTestWithConverter.convertTo({ prefix: "aba", value: "Tester" })).toBe("Tester");
  });

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue("test")).toBe("test");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.formatUrlValue({ prefix: "any", value: "test" })).toBe("test");
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("test")).toBe("test");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.parseUrlValue("test")).toStrictEqual({ prefix: "PREFIX_", value: "test" });
  });
});
