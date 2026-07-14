import { booleanToNumberConverter } from "@odata2ts/test-converters";
import { describe, expect, test } from "vitest";
import { QBooleanParam, ValueResponseConverterV4 } from "../../../src";
import { createResponse } from "../../test-infra/TestResponseHelper";

describe("ValueResponseConverterV4 tests", () => {
  const qValueParam = new QBooleanParam("TEST", "testProp", booleanToNumberConverter);
  const VALUE_INPUT = true;
  const VALUE_CONVERTED = 1;

  test("convert", () => {
    const converter = new ValueResponseConverterV4(qValueParam);
    const converter2 = new ValueResponseConverterV4(booleanToNumberConverter);

    const result = converter.convert(createResponse({ value: VALUE_INPUT }));
    const result2 = converter2.convert(createResponse({ value: VALUE_INPUT }));

    expect(result.data).toStrictEqual({ value: VALUE_CONVERTED });
    expect(result2).toStrictEqual(result);
  });

  test("return non matching input", () => {
    const converter = new ValueResponseConverterV4(booleanToNumberConverter);

    const nonMatching = [
      // unknown model
      { value: { x: VALUE_INPUT, y: VALUE_INPUT } },
      // wrong type
      { value: "test" },
      // wrong structure
      123,
      null,
    ];

    nonMatching.forEach((nm) => {
      const result = converter.convert(createResponse(nm));
      expect(result.data).toStrictEqual(nm);
    });
  });
});
