import {
  compileId,
  compileFunctionPathV2,
  compileFunctionPathV4,
  compileLiteralValue,
  compileQuotedValue,
  compileActionPath,
  parseId,
} from "../src";
import { EntityKeySpec } from "../src/EntityModel";

describe("UrlHelper Test", () => {
  const BASE_PATH = "/base";
  const KEY_SPEC_COMPOSITE_ID: EntityKeySpec = [
    { isLiteral: false, type: "string", name: "name", odataName: "NAME" },
    { isLiteral: true, type: "number", name: "age", odataName: "Age" },
    { isLiteral: true, type: "boolean", name: "deceased", odataName: "dead" },
  ];
  const KEY_SPEC_STRING: EntityKeySpec = [{ isLiteral: false, type: "string", name: "toDo", odataName: "ToDo" }];
  const KEY_SPEC_NUMBER: EntityKeySpec = [{ isLiteral: true, type: "number", name: "toDo", odataName: "ToDo" }];
  const KEY_SPEC_BOOLEAN: EntityKeySpec = [{ isLiteral: true, type: "boolean", name: "toDo", odataName: "ToDo" }];
  const KEY_SPEC_GUID_V2: EntityKeySpec = [
    { isLiteral: true, type: "guid", typePrefix: "guid", name: "toDo", odataName: "ToDo" },
  ];

  const KEY_SPEC_V2: EntityKeySpec = [
    { isLiteral: false, type: "guid", typePrefix: "guid", name: "id", odataName: "ID" },
    { isLiteral: true, type: "datetime", typePrefix: "datetime", name: "timeStamp", odataName: "timeStamp" },
    { isLiteral: false, type: "string", name: "test", odataName: "Test" },
  ];

  test("compileFunctionPathV4", () => {
    let result = compileFunctionPathV4(BASE_PATH);
    expect(result).toBe(BASE_PATH + "()");

    result = compileFunctionPathV4(BASE_PATH, "myFunc");
    expect(result).toBe(BASE_PATH + "/myFunc()");
  });

  test("compileFunctionPathV4: with params", () => {
    const result = compileFunctionPathV4(BASE_PATH, undefined, {
      id: { isLiteral: true, value: "123" },
      test: { isLiteral: false, value: "test" },
      age: { isLiteral: true, value: 3 },
      age2: { isLiteral: false, value: 3 },
      oldEnough: { isLiteral: true, value: true },
      oldEnough2: { isLiteral: false, value: true },
    });

    expect(result).toBe(BASE_PATH + "(id=123,test='test',age=3,age2='3',oldEnough=true,oldEnough2='true')");
  });

  test("compileFunctionPathV4: with path and params", () => {
    const result = compileFunctionPathV4(BASE_PATH, undefined, {
      id: { isLiteral: true, value: "123" },
      test: { isLiteral: false, value: "test" },
      age: { isLiteral: true, value: 3 },
      age2: { isLiteral: false, value: 3 },
      oldEnough: { isLiteral: true, value: true },
      oldEnough2: { isLiteral: false, value: true },
    });

    expect(result).toBe(BASE_PATH + "(id=123,test='test',age=3,age2='3',oldEnough=true,oldEnough2='true')");
  });

  test("compileFunctionPathV4: null for optional params", () => {
    const result = compileFunctionPathV4(BASE_PATH, undefined, {
      id: { isLiteral: true, value: "123" },
      test: { isLiteral: false, value: undefined },
      age: { isLiteral: true, value: undefined },
      age2: { isLiteral: true, value: 0 },
      oldEnough: { isLiteral: true, value: false },
    });

    expect(result).toBe(BASE_PATH + "(id=123,test=null,age=null,age2=0,oldEnough=false)");
  });

  test("compileFunctionPathV4: fail with wrong params", () => {
    // @ts-expect-error
    expect(() => compileFunctionPathV4(null)).toThrowError();
    // @ts-expect-error
    expect(() => compileFunctionPathV4()).toThrowError();
    expect(() => compileFunctionPathV4("")).toThrowError();
    expect(() => compileFunctionPathV4(" ")).toThrowError();
    // @ts-expect-error
    expect(() => compileFunctionPath(BASE_PATH, undefined, "test")).toThrowError();
  });

  test("compileFunctionPathV2", () => {
    let result = compileFunctionPathV2(BASE_PATH);
    expect(result).toBe(BASE_PATH);

    result = compileFunctionPathV2(BASE_PATH, "myFunc");
    expect(result).toBe(BASE_PATH + "/myFunc");
  });

  test("compileFunctionPathV2: with params", () => {
    const result = compileFunctionPathV2(BASE_PATH, undefined, {
      id: { isLiteral: true, value: "123" },
      test: { isLiteral: false, value: "test" },
      age: { isLiteral: true, value: 3 },
      age2: { isLiteral: false, value: 3 },
      oldEnough: { isLiteral: true, value: true },
      oldEnough2: { isLiteral: false, value: true },
    });

    expect(result).toBe(BASE_PATH + "?id=123&test='test'&age=3&age2='3'&oldEnough=true&oldEnough2='true'");
  });

  test("compileFunctionPathV2: null for optional params", () => {
    const result = compileFunctionPathV2(BASE_PATH, undefined, {
      id: { isLiteral: true, value: "123" },
      test: { isLiteral: false, value: undefined },
      age: { isLiteral: true, value: undefined },
      age2: { isLiteral: true, value: 0 },
      oldEnough: { isLiteral: true, value: false },
    });

    expect(result).toBe(BASE_PATH + "?id=123&test=null&age=null&age2=0&oldEnough=false");
  });

  test("compileFunctionPathV2: fail with wrong params", () => {
    // @ts-expect-error
    expect(() => compileFunctionPathV2(null)).toThrowError();
    // @ts-expect-error
    expect(() => compileFunctionPathV2()).toThrowError();
    expect(() => compileFunctionPathV2("")).toThrowError();
    expect(() => compileFunctionPathV2(" ")).toThrowError();
    // @ts-expect-error
    expect(() => compileFunctionPathV2(BASE_PATH, undefined, "test")).toThrowError();
  });

  test("compileActionPath", () => {
    let result = compileActionPath(BASE_PATH);
    expect(result).toBe(BASE_PATH);

    result = compileActionPath(BASE_PATH, "myAction");
    expect(result).toBe(BASE_PATH + "/myAction");
  });

  test("compileActionPath: fail with wrong params", () => {
    // @ts-expect-error
    expect(() => compileActionPath(null)).toThrowError();
    // @ts-expect-error
    expect(() => compileActionPath()).toThrowError();
    expect(() => compileActionPath("")).toThrowError();
    expect(() => compileActionPath(" ")).toThrowError();
  });

  test("compileId: short form string", () => {
    const result = compileId(BASE_PATH, KEY_SPEC_STRING, "test");

    expect(result).toBe(BASE_PATH + "('test')");
  });

  test("compileId: short form number", () => {
    const result = compileId(BASE_PATH, KEY_SPEC_NUMBER, 5);

    expect(result).toBe(BASE_PATH + "(5)");
  });

  test("compileId: short form boolean", () => {
    expect(compileId(BASE_PATH, KEY_SPEC_BOOLEAN, "true")).toBe(BASE_PATH + "(true)");
    expect(compileId(BASE_PATH, KEY_SPEC_BOOLEAN, "false")).toBe(BASE_PATH + "(false)");
  });

  test("compileId: without base path", () => {
    const result = compileId("", KEY_SPEC_NUMBER, 5);

    expect(result).toBe("(5)");
  });

  test("compileId: compositeId", () => {
    const result = compileId(BASE_PATH, KEY_SPEC_COMPOSITE_ID, { Age: 5, NAME: "Tester", dead: false });
    const result2 = compileId(BASE_PATH, KEY_SPEC_COMPOSITE_ID, { Age: -1, NAME: "Tester", dead: true });

    expect(result).toBe(BASE_PATH + "(NAME='Tester',Age=5,dead=false)");
    expect(result2).toBe(BASE_PATH + "(NAME='Tester',Age=-1,dead=true)");
  });

  test("compileId: compositeId", () => {
    const result = compileId(BASE_PATH, KEY_SPEC_V2, { ID: 5, timeStamp: "2022-01-31", Test: "xxx" });

    expect(result).toBe(BASE_PATH + "(ID=guid'5',timeStamp=datetime'2022-01-31',Test='xxx')");
  });

  test("fail compileId: compositeId and primitive", () => {
    expect(() => compileId(BASE_PATH, KEY_SPEC_COMPOSITE_ID, "test")).toThrow();
    expect(() => compileId(BASE_PATH, KEY_SPEC_COMPOSITE_ID, 3)).toThrow();
  });

  test("fail compileId: non-matching keys and values", () => {
    expect(() => compileId(BASE_PATH, KEY_SPEC_COMPOSITE_ID, { name: "Heinz", age: 12, notThere: "sss" })).toThrow();
  });

  test("parseId: string", () => {
    const expected = {
      path: "test",
      keys: { ToDo: "xxx" },
    };

    expect(parseId("test('xxx')", KEY_SPEC_STRING)).toStrictEqual(expected);
    expect(parseId("test(ToDo='xxx')", KEY_SPEC_STRING)).toStrictEqual(expected);
  });

  test("parseId: number", () => {
    const expected = {
      path: "test",
      keys: { ToDo: 666 },
    };

    expect(parseId("test(666)", KEY_SPEC_NUMBER)).toStrictEqual(expected);
    expect(parseId("test(ToDo=666)", KEY_SPEC_NUMBER)).toStrictEqual(expected);
  });

  test("parseId: boolean", () => {
    const expected = {
      path: "test",
      keys: { ToDo: false },
    };

    expect(parseId("test(false)", KEY_SPEC_BOOLEAN)).toStrictEqual(expected);
    expect(parseId("test(ToDo=false)", KEY_SPEC_BOOLEAN)).toStrictEqual(expected);
  });

  test("fail parseId: boolean with wrong value", () => {
    const errorMatcher = /Invalid value for boolean attribute "ToDo"!/;

    expect(() => parseId("test('false')", KEY_SPEC_BOOLEAN)).toThrowError(errorMatcher);
    expect(() => parseId("test(ToDo=1)", KEY_SPEC_BOOLEAN)).toThrowError(errorMatcher);
  });

  test("parseId: with type prefix (V2 only)", () => {
    const expected = {
      path: "test",
      keys: { ToDo: "xxx" },
    };

    expect(parseId("test(guid'xxx')", KEY_SPEC_GUID_V2)).toStrictEqual(expected);
    expect(parseId("test(ToDo=guid'xxx')", KEY_SPEC_GUID_V2)).toStrictEqual(expected);
  });

  test("parseId: composite key", () => {
    expect(parseId("test(NAME='xxx',Age=22,dead=false)", KEY_SPEC_COMPOSITE_ID)).toStrictEqual({
      path: "test",
      keys: { NAME: "xxx", Age: 22, dead: false },
    });
  });

  test("parseId: no base path", () => {
    const expected = {
      path: "",
      keys: { ToDo: "xxx" },
    };

    expect(parseId("(ToDo='xxx')", KEY_SPEC_STRING)).toStrictEqual(expected);
    expect(parseId("('xxx')", KEY_SPEC_STRING)).toStrictEqual(expected);
  });

  test("fail parseId: irregular ids", () => {
    const errorMatcher = /irregular id/i;

    expect(() => parseId(" ", KEY_SPEC_STRING)).toThrow(errorMatcher);
    // @ts-ignore
    expect(() => parseId(null, KEY_SPEC_STRING)).toThrow(errorMatcher);
    // @ts-ignore
    expect(() => parseId(undefined, KEY_SPEC_STRING)).toThrow(errorMatcher);
  });

  test("fail parseId: exact key match", () => {
    const wrongKeyMatcher = /Key "wrong" is not part of the key spec!/;

    expect(() => parseId("test(wrong='xxx')", KEY_SPEC_STRING)).toThrow(wrongKeyMatcher);
    expect(() => parseId("test(ToDo='xxx',wrong='xxx')", KEY_SPEC_STRING)).toThrow(wrongKeyMatcher);

    const errorMatcher = /not comply with key spec/i;

    expect(() => parseId("test()", KEY_SPEC_STRING)).toThrow(errorMatcher);
    expect(() => parseId("test(NAME='xxx')", KEY_SPEC_COMPOSITE_ID)).toThrow(errorMatcher);
  });

  test("fail parseId: key or value unspecified", () => {
    const errorMatcher = /Key and value must be specified/i;

    expect(() => parseId("test(='xxx')", KEY_SPEC_STRING)).toThrow(errorMatcher);
    expect(() => parseId("test(ToDo=)", KEY_SPEC_STRING)).toThrow(errorMatcher);
    expect(() => parseId("test(ToDo='')", KEY_SPEC_STRING)).toThrow(errorMatcher);
  });

  test("compileLiteralValue", () => {
    // string
    let test: string | number | boolean = "test";
    let result = compileLiteralValue(test);
    expect(result).toBe(test);

    // number
    test = 3;
    result = compileLiteralValue(test);
    expect(result).toBe("3");

    // boolean
    test = false;
    result = compileLiteralValue(test);
    expect(result).toBe("false");
  });

  test("failCompileLiteralValue: undefined, null, empty string", () => {
    // @ts-expect-error
    expect(() => compileLiteralValue(undefined)).toThrow();
    // @ts-expect-error
    expect(() => compileLiteralValue(null)).toThrow();
    expect(() => compileLiteralValue("")).toThrow();
    expect(() => compileLiteralValue(" ")).toThrow();
  });

  test("compileQuotedValue", () => {
    // string
    let test: string | number | boolean = "test";
    let result = compileQuotedValue(test);
    expect(result).toBe(`'${test}'`);

    // number
    test = 3;
    result = compileQuotedValue(test);
    expect(result).toBe("'3'");

    // boolean
    test = false;
    result = compileQuotedValue(test);
    expect(result).toBe("'false'");
  });

  test("failCompileQuotedValue: undefined, null, empty string", () => {
    // @ts-expect-error
    expect(() => compileQuotedValue(undefined)).toThrow();
    // @ts-expect-error
    expect(() => compileQuotedValue(null)).toThrow();
    expect(() => compileQuotedValue("")).toThrow();
    expect(() => compileQuotedValue(" ")).toThrow();
  });
});
