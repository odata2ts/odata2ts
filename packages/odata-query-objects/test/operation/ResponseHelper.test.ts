import { booleanToNumberConverter } from "@odata2ts/test-converters";

import {
  QBooleanParam,
  QComplexParam,
  ResponseConverter,
  ResponseConverterV2,
  convertV2CollectionResponse,
  convertV2ModelResponse,
  convertV2ValueResponse,
  convertV4CollectionResponse,
  convertV4ModelResponse,
  convertV4ValueResponse,
} from "../../src";
import { QParamModel } from "../../src/param/QParamModel";
import {
  QSimpleEntityWithConverter,
  SimpleEntityUnconverted,
  SimpleEntityWithConverter,
} from "../fixture/SimpleEntityWithConverter";
import { createResponse } from "../test-infra/TestResponseHelper";

describe("ResponseHelper Tests", function () {
  const qParam = new QBooleanParam("TEST", "testProp", booleanToNumberConverter);
  const VALUE_INPUT = true;
  const VALUE_CONVERTED = 1;

  const qModelParam = new QComplexParam("value", new QSimpleEntityWithConverter());
  const MODEL_INPUT: SimpleEntityUnconverted = {
    ID: 123,
    truth: true,
    AGE: 62,
  };
  const MODEL_CONVERTED: SimpleEntityWithConverter = {
    id: 123,
    truth: 1,
    age: "62",
  };

  const checkThatNonMatchingInputPassesAsItIs = (
    nonMatchingResponses: Array<any>,
    responseConverter: ResponseConverter | ResponseConverterV2,
    qObject: QParamModel<any, any>
  ) => {
    nonMatchingResponses.forEach((nm) => {
      const result = responseConverter(createResponse(nm), qObject);
      expect(result.data).toStrictEqual(nm);
    });
  };

  test("convertV2ValueResponse with non-matching attribute name", () => {
    const result = convertV2ValueResponse(createResponse({ d: { myResult: VALUE_INPUT } }), qParam);
    expect(result.data.d).toStrictEqual({ myResult: VALUE_CONVERTED });
  });

  test("convertV2ValueResponse with attribute mapping", () => {
    const result = convertV2ValueResponse(createResponse({ d: { TEST: VALUE_INPUT } }), qParam);
    expect(result.data.d).toStrictEqual({ testProp: VALUE_CONVERTED });
  });

  test("convertV2ValueResponse: just return non matching input", () => {
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

    checkThatNonMatchingInputPassesAsItIs(nonMatching, convertV2ValueResponse, qParam);
  });

  test("convertV2ModelResponse", () => {
    const result = convertV2ModelResponse(createResponse({ d: MODEL_INPUT }), qModelParam);
    expect(result.data.d).toStrictEqual(MODEL_CONVERTED);
  });

  test("convertV2ModelResponse: just return non matching input", () => {
    const nonMatching = [
      // unknown model
      { d: { x: VALUE_INPUT, y: VALUE_INPUT } },
      { d: { results: { x: VALUE_INPUT, y: VALUE_INPUT } } },
      // not an object
      { d: "test" },
      { d: { results: "test" } },
      // wrong response structure => "d" is missing
      { test: 123 },
      null,
    ];

    checkThatNonMatchingInputPassesAsItIs(nonMatching, convertV2ModelResponse, qModelParam);
  });

  test("convertV2CollectionResponse", () => {
    const result = convertV2CollectionResponse(createResponse({ d: { results: [MODEL_INPUT] } }), qModelParam);
    expect(result.data.d.results).toStrictEqual([MODEL_CONVERTED]);
  });

  test("convertV2CollectionResponse also works with one object instead of list", () => {
    const result = convertV2CollectionResponse(createResponse({ d: { results: MODEL_INPUT } }), qModelParam);
    expect(result.data.d.results).toStrictEqual(MODEL_CONVERTED);
  });

  test("convertV2CollectionResponse for primitive collection response V2", () => {
    const result = convertV2CollectionResponse(createResponse({ d: [MODEL_INPUT] }), qModelParam);
    expect(result.data.d).toStrictEqual([MODEL_CONVERTED]);
  });

  test("convertV2CollectionResponse: just return non matching input", () => {
    const nonMatching = [
      // unknown model
      { d: { results: [{ x: VALUE_INPUT, y: VALUE_INPUT }] } },
      { d: [{ x: VALUE_INPUT, y: VALUE_INPUT }] },
      // entity not an object
      { d: { results: ["test"] } },
      { d: ["test"] },
      // array not an object
      { d: { results: 123 } },
      { d: 123 },
      // wrong structure
      { d: "test" },
      true,
      undefined,
    ];

    checkThatNonMatchingInputPassesAsItIs(nonMatching, convertV2CollectionResponse, qModelParam);
  });

  test("convertV4ValueResponse", () => {
    const result = convertV4ValueResponse(createResponse({ value: true }), qParam);
    expect(result.data).toStrictEqual({ value: 1 });
  });

  test("convertV4ModelResponse: just return non matching input", () => {
    const nonMatching = [
      // unknown model
      { value: { x: VALUE_INPUT, y: VALUE_INPUT } },
      // wrong type
      { value: "test" },
      // wrong structure
      123,
      null,
    ];

    checkThatNonMatchingInputPassesAsItIs(nonMatching, convertV4ValueResponse, qParam);
  });

  test("convertV4ModelResponse", () => {
    const result = convertV4ModelResponse(createResponse(MODEL_INPUT), qModelParam);
    expect(result.data).toStrictEqual(MODEL_CONVERTED);
  });

  test("convertV4ModelResponse: just return non matching input", () => {
    const nonMatching = [
      // unknown model
      { x: VALUE_INPUT, y: VALUE_INPUT },
      // not an object
      "test",
      123,
      undefined,
    ];

    checkThatNonMatchingInputPassesAsItIs(nonMatching, convertV4ModelResponse, qModelParam);
  });

  test("convertV4CollectionResponse", () => {
    const result = convertV4CollectionResponse(createResponse({ value: [MODEL_INPUT] }), qModelParam);
    expect(result.data.value).toStrictEqual([MODEL_CONVERTED]);
  });

  test("convertV4CollectionResponse: also works with one object instead of list", () => {
    const result = convertV4CollectionResponse(createResponse({ value: MODEL_INPUT }), qModelParam);
    expect(result.data.value).toStrictEqual(MODEL_CONVERTED);
  });

  test("convertV4CollectionResponse: just return non matching input", () => {
    const nonMatching = [
      // unknown model
      { value: [{ x: VALUE_INPUT, y: VALUE_INPUT }] },
      { value: [{ x: VALUE_INPUT, y: VALUE_INPUT }] },
      // entity not an object
      { value: ["test"] },
      // result list not an object
      { value: "test" },
      // wrong structure
      "test",
      [123],
      undefined,
    ];

    checkThatNonMatchingInputPassesAsItIs(nonMatching, convertV4CollectionResponse, qModelParam);
  });
});
