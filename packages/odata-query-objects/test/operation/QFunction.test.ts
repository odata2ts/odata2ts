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

  test("QFunction: for IDs", () => {
    const exampleFunction = new BookIdFunction("EntityXy", { unencoded: true });
    expect(exampleFunction.buildUrl({ isbn: "123" })).toBe("EntityXy(isbn=123)");
    expect(exampleFunction.buildUrl("123")).toBe("EntityXy(123)");
    expect(exampleFunction.buildUrl("1?2/3&")).toBe("EntityXy(1?2/3&)");
    expect(exampleFunction.parseUrl("EntityXy(isbn=123)")).toMatchObject({ isbn: "123" });
    expect(exampleFunction.parseUrl("EntityXy(123)")).toBe("123");
    expect(exampleFunction.parseUrl("EntityXy(1?2/3&)")).toBe("1?2/3&");
  });

  test("QFunction: for IDs (encoded)", () => {
    const exampleFunction = new BookIdFunction("EntityXy");
    expect(exampleFunction.buildUrl({ isbn: "123" })).toBe("EntityXy(isbn=123)");
    expect(exampleFunction.buildUrl("123")).toBe("EntityXy(123)");
    expect(exampleFunction.buildUrl({ isbn: "1?2/3&" })).toBe("EntityXy(isbn=1%3F2%2F3%26)");
    expect(exampleFunction.buildUrl("1?2/3&")).toBe("EntityXy(1%3F2%2F3%26)");
  });

  test("QFunction: for IDs with V2 Param", () => {
    const exampleFunction = new BookIdV2Function("EntityXy");
    expect(exampleFunction.buildUrl({ isbn: "123" })).toBe("EntityXy(isbn=guid'123')");
    expect(exampleFunction.buildUrl("123")).toBe("EntityXy(guid'123')");
    expect(exampleFunction.parseUrl("EntityXy(isbn=guid'123')")).toMatchObject({ isbn: "123" });
    expect(exampleFunction.parseUrl("EntityXy(guid'123')")).toBe("123");
  });

  test("QFunction: for IDs with conversion", () => {
    const exampleFunction = new BookIdFunctionWithConversion("EntityXy");
    expect(exampleFunction.buildUrl({ test: 1 })).toBe("EntityXy(Test=true)");
    expect(exampleFunction.buildUrl(0)).toBe("EntityXy(false)");
    expect(exampleFunction.parseUrl("EntityXy(Test=true)")).toMatchObject({ test: 1 });
    expect(exampleFunction.parseUrl("EntityXy(true)")).toBe(1);
  });

  test("QFunction: failures", () => {
    const exampleFunction = new ComplexBookIdFunction("EntityXy");

    expect(exampleFunction.buildUrl({ title: "test", author: "xxx" })).toBe("EntityXy(title='test',author='xxx')");
    expect(exampleFunction.parseUrl("EntityXy(title='test',author='xxx')")).toStrictEqual({
      title: "test",
      author: "xxx",
    });

    // @ts-expect-error
    expect(() => exampleFunction.buildUrl({ isbn: "123" })).toThrow("Unknown parameter");
    // @ts-expect-error
    expect(() => exampleFunction.buildUrl("123")).toThrow("the function requires multiple parameters!");

    expect(() => exampleFunction.parseUrl("123")).toThrow("did not yield any params");
    expect(() => exampleFunction.parseUrl("EntityXy()")).toThrow("did not yield any params");
    expect(() => exampleFunction.parseUrl("EntityXy('123')")).toThrow("the function requires multiple parameters!");
    expect(() => exampleFunction.parseUrl("EntityXy(title,author=xxx)")).toThrow("Key and value must be specified");
    expect(() => exampleFunction.parseUrl("EntityXy(tiger=xxx)")).toThrow(
      "not part of this function's method signature"
    );
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
    expect(exampleFunction.buildUrl(allParams)).toBe(
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
