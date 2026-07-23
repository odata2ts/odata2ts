import { booleanToNumberConverter } from "@odata2ts/test-converters";
import { describe, expect, test } from "vitest";
import { QBooleanParam, ValueResponseConverterV2 } from "../../../src";
import { createResponse } from "../../test-infra/TestResponseHelper";

describe("ValueResponseConverterV2 tests", () => {
  const qValueParam = new QBooleanParam("TEST", "testProp", booleanToNumberConverter);
  const VALUE_INPUT = true;
  const VALUE_CONVERTED = 1;
  const CONVERTER = new ValueResponseConverterV2(qValueParam);

  test("convert", () => {
    const converter2 = new ValueResponseConverterV2(booleanToNumberConverter);

    const result = CONVERTER.convert(createResponse({ d: { myResult: VALUE_INPUT } }));
    const result2 = converter2.convert(createResponse({ d: { myResult: VALUE_INPUT } }));

    expect(result.data.d).toStrictEqual({ myResult: VALUE_CONVERTED });
    expect(result2).toStrictEqual(result);
  });

  test("convert with attribute mapping", () => {
    const result = CONVERTER.convert(createResponse({ d: { TEST: VALUE_INPUT } }));
    expect(result.data.d).toStrictEqual({ testProp: VALUE_CONVERTED });
  });

  test("return non matching input", () => {
    const nonMatching = [
      // two unknown props
      { d: { x: VALUE_INPUT, y: VALUE_INPUT } },
      { d: { results: { x: VALUE_INPUT, y: VALUE_INPUT } } },
      // not an object
      { d: "test" },
      { d: { results: "test" } },
      // wrong response structure => "d" is missing
      { test: 123 },
      undefined,
    ];

    nonMatching.forEach((nm) => {
      const result = CONVERTER.convert(createResponse(nm));
      expect(result.data).toStrictEqual(nm);
    });
  });
});
