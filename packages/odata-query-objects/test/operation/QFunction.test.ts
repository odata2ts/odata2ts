import { QGetSomethingFunction, QGetSomethingFunctionV2 } from "../fixture/operation/EmptyFunction";
import { BookIdFunction } from "../fixture/operation/IdFunction";
import {
  BestBookParamModel,
  BestBookParamModelV2,
  QBestBookFunction,
  QBestBookFunctionV2,
} from "../fixture/operation/ParamFunction";

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
    const exampleFunction = new BookIdFunction("EntityXy");
    expect(exampleFunction.buildUrl({ isbn: "123" })).toBe("EntityXy(isbn='123')");
    expect(exampleFunction.buildUrl("123")).toBe("EntityXy('123')");
    expect(exampleFunction.parseUrl("EntityXy(isbn='123')")).toMatchObject({ isbn: "123" });
    expect(exampleFunction.parseUrl("EntityXy('123')")).toBe("123");
  });

  test("QFunction: multiple params", () => {
    const exampleFunction = new QBestBookFunction();
    const requiredParams: BestBookParamModel = {
      // TODO: mappedName
      TestNumber: 3,
      // TODO: mappedName
      test_Boolean: false,
      testString: "testing",
      testGuid: "aaa-bbb",
    };
    const allParams: BestBookParamModel = {
      ...requiredParams,
      testDate: null,
      testTime: undefined,
      testDateTimeOffset: "dateTime",
    };

    expect(exampleFunction.buildUrl(requiredParams)).toBe(
      "BestBook(TestNumber=3,test_Boolean=false,testString='testing',testGuid=aaa-bbb)"
    );
    expect(exampleFunction.buildUrl(allParams)).toBe(
      "BestBook(TestNumber=3,test_Boolean=false,testString='testing',testGuid=aaa-bbb,testDate=null,testDateTimeOffset=dateTime)"
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
});
