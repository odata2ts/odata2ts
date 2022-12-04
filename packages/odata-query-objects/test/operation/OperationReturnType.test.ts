import { booleanToNumberConverter } from "@odata2ts/test-converters";

import { OperationReturnType, QBooleanParam, QComplexParam } from "../../src";
import { ReturnTypes, emptyOperationReturnType } from "../../src/operation/OperationReturnType";
import {
  QSimpleEntityWithConverter,
  SimpleEntityUnconverted,
  SimpleEntityWithConverter,
} from "../fixture/SimpleEntityWithConverter";
import { createResponse } from "../test-infra/TestResponseHelper";

describe("OperationReturnType Tests", function () {
  const VALUE_RETURN_TYPE = new OperationReturnType(
    ReturnTypes.VALUE,
    new QBooleanParam("TEST", "test", booleanToNumberConverter)
  );
  const VALUE_COLLECTION_RETURN_TYPE = new OperationReturnType(
    ReturnTypes.VALUE_COLLECTION,
    new QBooleanParam("NONE", undefined, booleanToNumberConverter)
  );

  const qModelParam = new QComplexParam("XXX", new QSimpleEntityWithConverter());
  const MODEL_RETURN_TYPE = new OperationReturnType(ReturnTypes.COMPLEX, qModelParam);
  const MODEL_COLLECTION_RETURN_TYPE = new OperationReturnType(ReturnTypes.COMPLEX_COLLECTION, qModelParam);

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

  const createV4ModelResponse = createResponse;
  const createV4ValueOrCollectionResponse = <T>(value: T) => {
    return createResponse({ value });
  };
  const createV2ValueOrModelResponse = <T>(value: T) => {
    return createResponse({ d: value });
  };
  const createV2CollectionResponse = <T>(value: T) => {
    return createResponse({ d: { results: value } });
  };

  test("empty", () => {
    const anyResponseValue = "who cares?";
    const result: OperationReturnType<void> = new OperationReturnType(ReturnTypes.VOID);

    expect(result.type).toBeUndefined();
    expect(result.returnType).toBe(ReturnTypes.VOID);
    expect(result).toStrictEqual(emptyOperationReturnType);

    // the response is expected to be void; however, we still pass the response as is
    expect(result.convertResponse(createResponse(anyResponseValue)).data).toBe(anyResponseValue);
    expect(result.convertResponseV2(createResponse(anyResponseValue)).data).toBe(anyResponseValue);
    expect(result.convertResponse(createResponse(null)).data).toBeNull();
    expect(result.convertResponseV2(createResponse(undefined)).data).toBeUndefined();
  });

  test("primitive conversion", () => {
    expect(VALUE_RETURN_TYPE.type).toBeInstanceOf(QBooleanParam);
    expect(VALUE_RETURN_TYPE.returnType).toBe(ReturnTypes.VALUE);

    expect(VALUE_RETURN_TYPE.convertResponse(createV4ValueOrCollectionResponse(true)).data).toStrictEqual({ value: 1 });
  });

  test("primitive collection conversion", () => {
    expect(VALUE_COLLECTION_RETURN_TYPE.type).toBeInstanceOf(QBooleanParam);
    expect(VALUE_COLLECTION_RETURN_TYPE.returnType).toBe(ReturnTypes.VALUE_COLLECTION);

    expect(
      VALUE_COLLECTION_RETURN_TYPE.convertResponse(createV4ValueOrCollectionResponse([true, false])).data
    ).toStrictEqual({
      value: [1, 0],
    });
  });

  test("model conversion", () => {
    expect(MODEL_RETURN_TYPE.type).toBe(qModelParam);
    expect(MODEL_RETURN_TYPE.returnType).toBe(ReturnTypes.COMPLEX);

    expect(MODEL_RETURN_TYPE.convertResponse(createV4ModelResponse(MODEL_INPUT)).data).toStrictEqual(MODEL_CONVERTED);
  });

  test("model collection conversion", () => {
    expect(MODEL_COLLECTION_RETURN_TYPE.type).toBe(qModelParam);
    expect(MODEL_COLLECTION_RETURN_TYPE.returnType).toBe(ReturnTypes.COMPLEX_COLLECTION);

    expect(
      MODEL_COLLECTION_RETURN_TYPE.convertResponse(createV4ValueOrCollectionResponse([MODEL_INPUT])).data
    ).toStrictEqual({
      value: [MODEL_CONVERTED],
    });
  });

  test("primitive conversion V2", () => {
    expect(VALUE_RETURN_TYPE.convertResponseV2(createV2ValueOrModelResponse({ TEST: false })).data.d).toStrictEqual({
      test: 0,
    });
  });

  test("primitive collection conversion V2", () => {
    expect(
      VALUE_COLLECTION_RETURN_TYPE.convertResponseV2(createV2CollectionResponse([true, false])).data.d
    ).toStrictEqual({
      results: [1, 0],
    });
  });

  test("model conversion V2", () => {
    expect(MODEL_RETURN_TYPE.convertResponseV2(createV2ValueOrModelResponse(MODEL_INPUT)).data).toStrictEqual({
      d: MODEL_CONVERTED,
    });
  });

  test("model collection conversion V2", () => {
    expect(
      MODEL_COLLECTION_RETURN_TYPE.convertResponseV2(createV2CollectionResponse([MODEL_INPUT])).data
    ).toStrictEqual({
      d: { results: [MODEL_CONVERTED] },
    });
  });
});
