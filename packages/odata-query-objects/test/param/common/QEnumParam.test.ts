import { FIXED_DATE, FIXED_STRING, fixedDateConverter, stringToPrefixModelConverter } from "@odata2ts/test-converters";

import { QEnumParam } from "../../../src";

describe("QEnumParam Tests", () => {
  const NAME = "T3st_bbb";
  const toTest = new QEnumParam(NAME);
  const toTestWithConverter = new QEnumParam(NAME, undefined, stringToPrefixModelConverter);
  const convertedInputModel = { prefix: "PREFIX_", value: "Tester" };

  test("base attributes", () => {
    expect(toTest.getName()).toBe(NAME);
    expect(toTest.getMappedName()).toBe(NAME);
    expect(toTest.getConverter()).toBeDefined();
  });

  test("fail creation", () => {
    // @ts-expect-error
    expect(() => new QEnumParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QEnumParam(null)).toThrowError();
  });

  test("mapped name", () => {
    const mappedName = "t3stBbb";
    const toTest = new QEnumParam(NAME, mappedName);

    expect(toTest.getName()).toBe(NAME);
    expect(toTest.getMappedName()).toBe(mappedName);
    expect(toTest.getConverter()).toBeDefined();
  });

  test("converter", () => {
    expect(toTestWithConverter.convertFrom("Tester")).toStrictEqual(convertedInputModel);
    expect(toTestWithConverter.convertTo(convertedInputModel)).toBe("Tester");
  });

  test("converter to different type", () => {
    const toTest = new QEnumParam<Date>(NAME, undefined, fixedDateConverter);
    expect(toTest.convertFrom("Tester")).toBe(FIXED_DATE);
    expect(toTest.convertTo(new Date())).toBe(FIXED_STRING);
  });

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue("Te3st")).toBe("'Te3st'");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.formatUrlValue(convertedInputModel)).toBe("'Tester'");
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("'Te3st'")).toBe("Te3st");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.parseUrlValue("'Tester'")).toStrictEqual(convertedInputModel);
  });
});
