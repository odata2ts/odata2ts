import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { describe, expect, expectTypeOf, test } from "vitest";
import { BookModel } from "../fixture/operation/BookModel";
import { QGetSomethingFunction, QGetSomethingFunctionV2 } from "../fixture/operation/EmptyFunction";
import { OverloadedFunctionParamModel, QOverloadedFunction } from "../fixture/operation/OverloadedFunction";
import {
  BestBookParamModel,
  BestBookParamModelV2,
  QBestBookFunction,
  QBestBookFunctionV2,
  TestFeatures,
  TestRatings,
} from "../fixture/operation/ParamFunction";
import { QPrimitiveReturningFunction, QPrimitiveReturningFunctionV2 } from "../fixture/operation/ReturningFunctions";
import { createResponse } from "../test-infra/TestResponseHelper";

describe("QFunction Tests", () => {
  test("QFunction: base props", () => {
    const exampleFunction = new QGetSomethingFunction();
    expect(exampleFunction.getName()).toBe("getSomething");
    expect(exampleFunction.buildUrl()).toBe("getSomething()");
    expect(exampleFunction.getResponseConverter()).toBeUndefined();
    expect(exampleFunction.parseUrl("xyz")).toBeUndefined();
    expect(exampleFunction.parseUrl("xyz()")).toBeUndefined();
  });

  test("QFunction: V2 mode", () => {
    const exampleFunction = new QGetSomethingFunctionV2();
    expect(exampleFunction.getName()).toBe("getSomething");
    expect(exampleFunction.buildUrl()).toBe("getSomething");
    expect(exampleFunction.getResponseConverter()).toBeUndefined();
    expect(exampleFunction.parseUrl("xyz")).toBeUndefined();
    expect(exampleFunction.parseUrl("xyz(123)")).toBeUndefined();
  });

  test("QFunction: with params", () => {
    const exampleFunction = new QBestBookFunction();
    const requiredParams: BestBookParamModel = {
      testNumber: 3,
      testBoolean: 0,
      testString: { prefix: "PREFIX_", value: "testing" },
      testGuid: "aaa-bbb",
    };

    const resultRequired = "BestBook(TestNumber=3,test_Boolean=false,testString='testing',testGuid=aaa-bbb)";
    expect(exampleFunction.buildUrl(requiredParams)).toBe(resultRequired);
    expect(exampleFunction.parseUrl(resultRequired)).toStrictEqual(requiredParams);
  });

  test("QFunction: all possible params & encoding", () => {
    const exampleFunction = new QBestBookFunction();
    const allParams: BestBookParamModel = {
      testNumber: 3,
      testBoolean: 0,
      testString: { prefix: "PREFIX_", value: "testing" },
      testGuid: "aaa-bbb",
      "test/Date": null,
      testTime: undefined,
      testDateTimeOffset: "date/Time",
      testCollection: ["a", "b"],
      testEntity: { title: "testBook", author: { name: { prefix: "___", value: "testAuthor" } } },
      testEnum: TestFeatures.A,
      testNumericEnum: [TestRatings.TOP, TestRatings.BAD],
    };

    expect(exampleFunction.buildUrl(allParams, true)).toBe(
      "BestBook(" +
        "TestNumber=3" +
        ",test_Boolean=false" +
        ",testString='testing'" +
        ",testGuid=aaa-bbb" +
        ",test/Date=null" +
        ",testDateTimeOffset=date/Time" +
        ",testCollection=@testCollection" +
        ",TEST_ENTITY=@TEST_ENTITY" +
        ",testEnum='A'" +
        ",testNumericEnum=@testNumericEnum" +
        ")" +
        '?@testCollection=["a","b"]' +
        '&@TEST_ENTITY={"Title":"testBook","AUTHOR":{"Name":"testAuthor"}}' +
        '&@testNumericEnum=["TOP","BAD"]',
    );
    expect(exampleFunction.buildUrl(allParams)).toBe(
      "BestBook(" +
        "TestNumber=3" +
        ",test_Boolean=false" +
        ",testString='testing'" +
        ",testGuid=aaa-bbb" +
        ",test%2FDate=null" +
        ",testDateTimeOffset=date%2FTime" +
        ",testCollection=@testCollection" +
        ",TEST_ENTITY=@TEST_ENTITY" +
        ",testEnum='A'" +
        ",testNumericEnum=@testNumericEnum" +
        ")" +
        "?@testCollection=%5B%22a%22%2C%22b%22%5D" +
        "&@TEST_ENTITY=%7B%22Title%22%3A%22testBook%22%2C%22AUTHOR%22%3A%7B%22Name%22%3A%22testAuthor%22%7D%7D" +
        "&@testNumericEnum=%5B%22TOP%22%2C%22BAD%22%5D",
    );
  });

  test("QFunction: V2 with params", () => {
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

  test("QFunction: response converter", () => {
    const responseConverter = new QBestBookFunction().getResponseConverter()!;
    const exampleBook = {
      Title: "Wuthering Heights",
      AUTHOR: {
        Name: "Heinz Tester",
      },
    };
    const exampleResponse: HttpResponseModel<any> = {
      status: 200,
      statusText: "OK",
      headers: {},
      data: exampleBook,
    };

    expect(responseConverter).toBeDefined();
    const result = responseConverter.convert(exampleResponse);
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<BookModel>>>();

    expect(result).toStrictEqual({
      ...exampleResponse,
      data: {
        title: exampleBook.Title,
        author: {
          name: {
            prefix: "PREFIX_",
            value: exampleBook.AUTHOR.Name,
          },
        },
      },
    });

    // const exampleFunction = new QPrimitiveReturningFunction();
  });

  // test("QFunction: primitive response conversion", () => {
  //   const exampleFunction = new QPrimitiveReturningFunction();
  //
  //   expect(exampleFunction.convertResponse(createResponse({ value: true })).data).toStrictEqual({ value: 1 });
  // });
  //
  // test("QFunction: V2 primitive response conversion", () => {
  //   const exampleFunction = new QPrimitiveReturningFunctionV2();
  //
  //   expect(exampleFunction.convertResponse(createResponse({ d: { any: true } })).data).toStrictEqual({ d: { any: 1 } });
  // });

  test("QFunction: overloaded params", () => {
    const exampleFunction = new QOverloadedFunction();
    const params: OverloadedFunctionParamModel = {
      testNumber: 3,
      testBoolean: 0,
    };
    const altParams: OverloadedFunctionParamModel = {
      id: "123",
    };

    let expectedResult = "OverloadedFunction(TestNumber=3,test_Boolean=false)";
    expect(exampleFunction.buildUrl(params)).toBe(expectedResult);
    expect(exampleFunction.parseUrl(expectedResult)).toStrictEqual(params);

    expectedResult = "OverloadedFunction(ID='123')";
    expect(exampleFunction.buildUrl(altParams, true)).toBe(expectedResult);
    expect(exampleFunction.parseUrl(expectedResult)).toStrictEqual(altParams);

    expectedResult = "OverloadedFunction('123')";
    expect(exampleFunction.buildUrl(altParams.id, true)).toBe(expectedResult);
    expect(exampleFunction.parseUrl(expectedResult)).toBe(altParams.id);
  });

  test("QFunction: fail overloaded params matching", () => {
    const exampleFunction = new QOverloadedFunction();

    // @ts-ignore
    expect(exampleFunction.buildUrl({ notExistent: "ay" })).toBe(exampleFunction.getName() + "()");
    // @ts-ignore
    expect(exampleFunction.buildUrl()).toBe(exampleFunction.getName() + "()");
  });
});
