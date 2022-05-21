import {
  compileId,
  compileFunctionPathV2,
  compileFunctionPathV4,
  compileLiteralValue,
  compileQuotedValue,
  compileActionPath,
} from "../src";

describe("UrlHelper Test", () => {
  const BASE_PATH = "/base";
  const KEY_SPEC_COMPOSITE_ID = [
    { isLiteral: false, name: "name", odataName: "NAME" },
    { isLiteral: true, name: "age", odataName: "Age" },
    { isLiteral: true, name: "deceased", odataName: "dead" },
  ];
  const KEY_SPEC_STRING = [{ isLiteral: false, name: "toDo", odataName: "ToDo" }];
  const KEY_SPEC_NUMBER = [{ isLiteral: true, name: "toDo", odataName: "ToDo" }];

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

  test("compileId: quoted string", () => {
    const result = compileId(BASE_PATH, KEY_SPEC_STRING, "test");

    expect(result).toBe(BASE_PATH + "('test')");
  });

  test("compileId: literal number", () => {
    const result = compileId(BASE_PATH, KEY_SPEC_NUMBER, 5);

    expect(result).toBe(BASE_PATH + "(5)");
  });

  test("compileId: without base path", () => {
    const result = compileId("", KEY_SPEC_NUMBER, 5);

    expect(result).toBe("(5)");
  });

  test("compileId: compositeId", () => {
    const result = compileId(BASE_PATH, KEY_SPEC_COMPOSITE_ID, { Age: 5, NAME: "Tester", dead: false });
    expect(result).toBe(BASE_PATH + "(NAME='Tester',Age=5,dead=false)");
  });

  test("fail compileId: compositeId and primitive", () => {
    expect(() => compileId(BASE_PATH, KEY_SPEC_COMPOSITE_ID, "test")).toThrow();
    expect(() => compileId(BASE_PATH, KEY_SPEC_COMPOSITE_ID, 3)).toThrow();
  });

  test("fail compileId: non-matching keys and values", () => {
    expect(() => compileId(BASE_PATH, KEY_SPEC_COMPOSITE_ID, { name: "Heinz", age: 12, notThere: "sss" })).toThrow();
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
