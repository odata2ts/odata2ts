import { stringToPrefixModelConverter } from "@odata2ts/test-converters";

import { QSingleV2Param } from "../../../src/";

describe("QSingleV2Param Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QSingleV2Param(name);
  const toTestWithConverter = new QSingleV2Param(name, undefined, stringToPrefixModelConverter);
  const CONVERTER_OUTPUT = "33.3";
  const CONVERTER_INPUT = { prefix: "PREFIX_", value: CONVERTER_OUTPUT };

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue("33")).toBe("33f");
    expect(toTest.formatUrlValue("-33.1233")).toBe("-33.1233f");
    // @ts-expect-error
    expect(toTest.formatUrlValue(33)).toBe("33f");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.formatUrlValue(CONVERTER_INPUT)).toBe(CONVERTER_OUTPUT + "f");
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("-33.1233f")).toBe("-33.1233");
    expect(toTest.parseUrlValue("-33.1233")).toBe("-33.1233");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.parseUrlValue(CONVERTER_OUTPUT + "f")).toStrictEqual(CONVERTER_INPUT);
  });
});
