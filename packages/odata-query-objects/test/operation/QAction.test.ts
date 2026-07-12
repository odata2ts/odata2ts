import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { describe, expect, test } from "vitest";
import { EMPTY_ACTION_NAME, QEmptyAction } from "../fixture/operation/EmptyAction";
import { ParamActionParamModel, QParamAction } from "../fixture/operation/ParamAction";
import { createResponse } from "../test-infra/TestResponseHelper";

describe("QAction Tests", () => {
  test("QAction: base props", () => {
    const exampleOperation = new QEmptyAction();
    expect(exampleOperation.getName()).toBe(EMPTY_ACTION_NAME);
    expect(exampleOperation.buildUrl()).toBe(EMPTY_ACTION_NAME);
    expect(exampleOperation.getParams()).toBeUndefined();
    expect(exampleOperation.getRequestConverter()).toBeUndefined();
    expect(exampleOperation.getResponseConverter()).toBeUndefined();
  });

  test("QAction: with params", () => {
    const exampleOperation = new QParamAction();

    expect(exampleOperation.getParams()).toBeDefined();
    expect(exampleOperation.getParams().length).toBe(7);
    expect(exampleOperation.getResponseConverter()).toBeDefined();
    expect(exampleOperation.getRequestConverter()).toBeDefined();
  });

  test("request converter: conversion", () => {
    const reqConv = new QParamAction().getRequestConverter()!;

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

    expect(reqConv).toBeDefined();
    expect(reqConv.convertTo(requiredUserParams)).toMatchObject(requiredODataParams);
    expect(reqConv.convertTo(allUserParams)).toMatchObject(allODataParams);
  });

  test("request converter: with wrong params", () => {
    const reqConv = new QParamAction().getRequestConverter()!;

    // @ts-expect-error
    expect(reqConv.convertTo()).toBeUndefined();
    // @ts-expect-error
    expect(() => reqConv.convertTo({ dummy: "xxx" })).toThrow("Unknown parameter");
  });

  test("response converter: conversion", () => {
    const origResponse: HttpResponseModel<any> = createResponse({ value: "test" });

    const conv = new QParamAction().getResponseConverter()!;
    expect(conv).toBeDefined();

    const result: HttpResponseModel<ODataValueResponseV4<string>> = conv.convert(origResponse);
    expect(result).toStrictEqual({
      ...origResponse,
      data: { value: "TEST" },
    });
  });
});
