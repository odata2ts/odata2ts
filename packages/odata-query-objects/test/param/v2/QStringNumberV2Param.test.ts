import { stringToPrefixModelConverter } from "@odata2ts/test-converters";

import { QStringNumberV2Param } from "../../../src/";

describe("QStringNumberV2Param Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QStringNumberV2Param(name);
  const toTestWithConverter = new QStringNumberV2Param(name, undefined, stringToPrefixModelConverter);
  const CONVERTER_OUTPUT = "33.3";
  const CONVERTER_INPUT = { prefix: "PREFIX_", value: CONVERTER_OUTPUT };

  test("base attributes", () => {
    expect(toTest.getName()).toBe(name);
    expect(toTest.getMappedName()).toBe(name);
    expect(toTest.getConverter()).toBeDefined();
  });

  test("fail creation", () => {
    // @ts-expect-error
    expect(() => new QDecimalV2Param()).toThrowError();
    // @ts-expect-error
    expect(() => new QDecimalV2Param(null)).toThrowError();
  });

  test("mapped name", () => {
    const test = new QStringNumberV2Param(name, "myTest");
    expect(test.getName()).toBe(name);
    expect(test.getMappedName()).toBe("myTest");
  });

  test("converter", () => {
    expect(toTestWithConverter.convertFrom(CONVERTER_OUTPUT)).toStrictEqual(CONVERTER_INPUT);
    expect(toTestWithConverter.convertTo(CONVERTER_INPUT)).toBe(CONVERTER_OUTPUT);
  });

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue("33")).toBe("33");
    expect(toTest.formatUrlValue("-33.1233")).toBe("-33.1233");
    // @ts-expect-error
    expect(toTest.formatUrlValue(33)).toBe("33");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.formatUrlValue(CONVERTER_INPUT)).toBe(CONVERTER_OUTPUT);
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("-33.1233")).toBe("-33.1233");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.parseUrlValue(CONVERTER_OUTPUT)).toStrictEqual(CONVERTER_INPUT);
  });
});
