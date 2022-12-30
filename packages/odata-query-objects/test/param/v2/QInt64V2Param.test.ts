import { stringToPrefixModelConverter } from "@odata2ts/test-converters";

import { QInt64V2Param } from "../../../src/";

describe("QInt64V2Param Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QInt64V2Param(name);
  const toTestWithConverter = new QInt64V2Param(name, undefined, stringToPrefixModelConverter);
  const CONVERTER_OUTPUT = "33.3";
  const CONVERTER_INPUT = { prefix: "PREFIX_", value: CONVERTER_OUTPUT };

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue("33")).toBe("33L");
    expect(toTest.formatUrlValue("-33.1233")).toBe("-33.1233L");
    // @ts-expect-error
    expect(toTest.formatUrlValue(33)).toBe("33L");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.formatUrlValue(CONVERTER_INPUT)).toBe(CONVERTER_OUTPUT + "L");
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("-33.1233L")).toBe("-33.1233");
    expect(toTest.parseUrlValue("-33.1233")).toBe("-33.1233");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.parseUrlValue(CONVERTER_OUTPUT + "L")).toStrictEqual(CONVERTER_INPUT);
  });
});
