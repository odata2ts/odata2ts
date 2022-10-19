import { FIXED_DATE, FIXED_STRING, fixedDateConverter, stringToPrefixModelConverter } from "@odata2ts/test-converters";

import { QStringParam } from "../../../src";

describe("QStringParam Tests", () => {
  const NAME = "T3st_bbb";
  const toTest = new QStringParam(NAME);
  const inputModel = { prefix: "PREFIX_", value: "Tester" };
  const toTestWithConverter = new QStringParam(NAME, undefined, stringToPrefixModelConverter);

  test("base attributes", () => {
    expect(toTest.getName()).toBe(NAME);
    expect(toTest.getMappedName()).toBe(NAME);
    expect(toTest.getConverter()).toBeDefined();
  });

  test("fail creation", () => {
    // @ts-expect-error
    expect(() => new QStringParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QStringParam(null)).toThrowError();
  });

  test("mapped name", () => {
    const mappedName = "t3stBbb";
    const toTest = new QStringParam(NAME, mappedName);

    expect(toTest.getName()).toBe(NAME);
    expect(toTest.getMappedName()).toBe(mappedName);
    expect(toTest.getConverter()).toBeDefined();
  });

  test("converter", () => {
    expect(toTestWithConverter.convertFrom("Tester")).toStrictEqual(inputModel);
    expect(toTestWithConverter.convertTo(inputModel)).toBe("Tester");
  });

  test("converter to different type", () => {
    const toTest = new QStringParam<Date>(NAME, undefined, fixedDateConverter);
    expect(toTest.convertFrom("Tester")).toBe(FIXED_DATE);
    expect(toTest.convertTo(new Date())).toBe(FIXED_STRING);
  });

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue("Te3st")).toBe("'Te3st'");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.formatUrlValue(inputModel)).toBe(`'${inputModel.value}'`);
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("'Te3st'")).toBe("Te3st");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.parseUrlValue(`'${inputModel.value}'`)).toStrictEqual(inputModel);
  });
});
