import { EMPTY_ACTION_NAME, QEmptyAction } from "../fixture/operation/EmptyAction";
import { ParamActionParamModel, QParamAction } from "../fixture/operation/ParamAction";
import { QComplexReturningAction, QPrimitiveReturningFunction } from "../fixture/operation/ReturningFunctions";
import { SimpleEntityUnconverted, SimpleEntityWithConverter } from "../fixture/SimpleEntityWithConverter";
import { createResponse } from "../test-infra/TestResponseHelper";

describe("QAction Tests", () => {
  test("QAction: base props", () => {
    const exampleOperation = new QEmptyAction();
    expect(exampleOperation.getName()).toBe(EMPTY_ACTION_NAME);
    expect(exampleOperation.buildUrl()).toBe(EMPTY_ACTION_NAME);
    expect(exampleOperation.getParams()).toBeUndefined();
    expect(exampleOperation.convertUserParams(undefined)).toBeUndefined();
    expect(exampleOperation.convertODataParams(undefined)).toBeUndefined();
  });

  test("QAction: with params", () => {
    const requiredUserParams: ParamActionParamModel = {
      testGuid: "aaa-bbb",
      testString: "hi",
      testBoolean: 1,
      testNumber: 3,
    };
    const allUserParams: ParamActionParamModel = {
      ...requiredUserParams,
      testDate: null,
      testTime: "PY32",
    };
    const requiredODataParams: Record<string, any> = {
      testGuid: requiredUserParams.testGuid,
      TEST_STRING: requiredUserParams.testString,
      testBoolean: true,
      testNumber: requiredUserParams.testNumber,
    };
    const allODataParams: Record<string, any> = {
      ...requiredODataParams,
      testDate: null,
      testTime: "PY32",
    };
    const exampleOperation = new QParamAction();

    expect(exampleOperation.getParams()).toBeDefined();
    expect(exampleOperation.getParams().length).toBe(7);
    expect(exampleOperation.convertUserParams(requiredUserParams)).toMatchObject(requiredODataParams);
    expect(exampleOperation.convertUserParams(allUserParams)).toMatchObject(allODataParams);
    expect(exampleOperation.convertODataParams(requiredODataParams)).toMatchObject(requiredUserParams);
    expect(exampleOperation.convertODataParams(allODataParams)).toMatchObject(allUserParams);
  });

  test("with wrong params", () => {
    const requiredUserParams: ParamActionParamModel = {
      testGuid: "aaa-bbb",
      testString: "hi",
      testBoolean: 1,
      testNumber: 3,
    };
    const exampleOperation = new QParamAction();

    // @ts-expect-error
    expect(exampleOperation.convertUserParams()).toBeUndefined();
    // @ts-expect-error
    expect(exampleOperation.convertODataParams()).toBeUndefined();
    // @ts-expect-error
    expect(() => exampleOperation.convertUserParams({ dummy: "xxx" })).toThrow("Unknown parameter");
    expect(() => exampleOperation.convertODataParams({ dummy: "xxx" })).toThrow("Unknown parameter");
  });

  test("QAction: model response conversion", () => {
    const exampleAction = new QComplexReturningAction();
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

    expect(exampleAction.convertResponse(createResponse(MODEL_INPUT)).data).toStrictEqual(MODEL_CONVERTED);
  });
});
