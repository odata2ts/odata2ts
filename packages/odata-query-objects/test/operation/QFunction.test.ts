import { QGetSomethingFunction, QGetSomethingFunctionV2 } from "../fixture/operation/EmptyFunction";
import {
  BookIdFunction,
  BookIdFunctionWithConversion,
  BookIdV2Function,
  ComplexBookIdFunction,
} from "../fixture/operation/IdFunction";
import {
  BestBookParamModel,
  BestBookParamModelV2,
  QBestBookFunction,
  QBestBookFunctionV2,
} from "../fixture/operation/ParamFunction";
import { QPrimitiveReturningFunction, QPrimitiveReturningFunctionV2 } from "../fixture/operation/ReturningFunctions";
import { createResponse } from "../test-infra/TestResponseHelper";

describe("QFunction Tests", () => {
  test("QFunction: base props", () => {
    const exampleFunction = new QGetSomethingFunction();
    expect(exampleFunction.getName()).toBe("getSomething");
    expect(exampleFunction.buildUrl()).toBe("getSomething()");
    expect(exampleFunction.parseUrl("xyz")).toBeUndefined();
    expect(exampleFunction.parseUrl("xyz()")).toBeUndefined();
  });

  test("QFunction: V2 mode", () => {
    const exampleFunction = new QGetSomethingFunctionV2();
    expect(exampleFunction.getName()).toBe("getSomething");
    expect(exampleFunction.buildUrl()).toBe("getSomething");
    expect(exampleFunction.parseUrl("xyz")).toBeUndefined();
    expect(exampleFunction.parseUrl("xyz(123)")).toBeUndefined();
  });

  test("QFunction: multiple params", () => {
    const exampleFunction = new QBestBookFunction();
    const requiredParams: BestBookParamModel = {
      testNumber: 3,
      testBoolean: 0,
      testString: { prefix: "PREFIX_", value: "testing" },
      testGuid: "aaa-bbb",
    };
    const allParams: BestBookParamModel = {
      ...requiredParams,
      testDate: null,
      testTime: undefined,
      testDateTimeOffset: "dateTime",
      testCollection: ["a", "b"],
      testEntity: { title: "testBook", author: { name: { prefix: "___", value: "testAuthor" } } },
    };

    const resultRequired = "BestBook(TestNumber=3,test_Boolean=false,testString='testing',testGuid=aaa-bbb)";
    expect(exampleFunction.buildUrl(requiredParams)).toBe(resultRequired);
    expect(exampleFunction.parseUrl(resultRequired)).toStrictEqual(requiredParams);
    expect(exampleFunction.buildUrl(allParams, true)).toBe(
      "BestBook(" +
        "TestNumber=3,test_Boolean=false,testString='testing',testGuid=aaa-bbb,testDate=null,testDateTimeOffset=dateTime" +
        ',testCollection=["a","b"]' +
        ',TEST_ENTITY={"title":"testBook","AUTHOR":{"name":"testAuthor"}}' +
        ")"
    );
  });

  test("QFunction: V2 multiple params", () => {
    const exampleFunction = new QBestBookFunctionV2();
    const requiredParams: BestBookParamModelV2 = {
      testGuid: "aa-bb",
      testDateTime: "testDt",
      testTime: "testTime",
      testDateTimeOffset: "testDtOffset",
    };
    const allParams: BestBookParamModelV2 = {
      ...requiredParams,
      testBoolean: undefined,
      testString: null,
    };
    const expected =
      "BestBook?testGuid=guid'aa-bb'&testDateTime=datetime'testDt'&testTime=time'testTime'&testDateTimeOffset=datetimeoffset'testDtOffset'";

    expect(exampleFunction.buildUrl(requiredParams)).toBe(expected);
    expect(exampleFunction.buildUrl(allParams)).toBe(expected + "&testString=null");
  });

  test("QFunction: primitive response conversion", () => {
    const exampleFunction = new QPrimitiveReturningFunction();

    expect(exampleFunction.convertResponse(createResponse({ value: true })).data).toStrictEqual({ value: 1 });
  });

  test("QFunction: V2 primitive response conversion", () => {
    const exampleFunction = new QPrimitiveReturningFunctionV2();

    expect(exampleFunction.convertResponse(createResponse({ d: { any: true } })).data).toStrictEqual({ d: { any: 1 } });
  });
});
