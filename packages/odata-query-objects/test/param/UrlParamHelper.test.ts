import {
  NumberFilterOperators,
  QPathModel,
  StandardFilterOperators,
  StringFilterFunctions,
  UrlParamModel,
  buildFunctionExpression,
  buildOperatorExpression,
  buildQFilterOperation,
  createParsingRegexp,
  getExpressionValue,
  getParamValue,
  isPathValue,
  parseParamValue,
  withQuotes,
  withTypePrefix,
  withTypeSuffix,
} from "../../src";

describe("UrlParamHelper Tests", () => {
  const quotedTest: UrlParamModel = { isQuoted: true };
  const prefixedTest: UrlParamModel = { typePrefix: "guid" };
  const suffixedTest: UrlParamModel = { typeSuffix: ".mysuffix" };
  const qPathTest: QPathModel = {
    getPath: () => "qpath",
  };

  test("withTypePrefix", () => {
    expect(withTypePrefix("PRE", "test")).toBe("PRE'test'");
    expect(withTypePrefix("PRE", 3)).toBe("PRE'3'");
    expect(withTypePrefix("PRE", false)).toBe("PRE'false'");
    // @ts-expect-error
    expect(withTypePrefix("PRE", null)).toBe("PRE'null'");
    // @ts-expect-error
    expect(withTypePrefix("PRE", undefined)).toBe("PRE'undefined'");
  });

  test("withTypeSuffix", () => {
    expect(withTypeSuffix("SUF", "test")).toBe("testSUF");
    expect(withTypeSuffix("suf", 3)).toBe("3suf");
    expect(withTypeSuffix("SUF", false)).toBe("falseSUF");
    // @ts-expect-error
    expect(withTypeSuffix("SUF", null)).toBe("nullSUF");
    // @ts-expect-error
    expect(withTypeSuffix("SUF", undefined)).toBe("undefinedSUF");
  });

  test("withQuotes", () => {
    expect(withQuotes("test")).toBe("'test'");
    expect(withQuotes(3)).toBe("'3'");
    expect(withQuotes(false)).toBe("'false'");
    // @ts-expect-error
    expect(withQuotes(null)).toBe("'null'");
    // @ts-expect-error
    expect(withQuotes(undefined)).toBe("'undefined'");
  });

  test("isPathValue", () => {
    expect(isPathValue(qPathTest)).toBe(true);

    expect(isPathValue("test")).toBe(false);
    expect(isPathValue(3)).toBe(false);
    expect(isPathValue(false)).toBe(false);
    expect(isPathValue(null)).toBe(false);
    expect(isPathValue(undefined)).toBe(false);
  });

  test("getExpressionValue", () => {
    expect(getExpressionValue(qPathTest)).toBe(qPathTest.getPath());
    expect(getExpressionValue(null)).toBe("null");

    expect(getExpressionValue("test")).toBe("test");
    expect(getExpressionValue(3)).toBe("3");
    expect(getExpressionValue(false)).toBe("false");
    expect(getExpressionValue(3, { typePrefix: "aba" })).toBe("aba'3'");

    // @ts-expect-error
    expect(getExpressionValue(undefined)).toBe("undefined");
  });

  test("buildOperatorExpression", () => {
    expect(buildOperatorExpression("test", NumberFilterOperators.ADDITION, "5")).toBe("test add 5");
    expect(buildOperatorExpression("test", StandardFilterOperators.LOWER_THAN, "5")).toBe("test lt 5");
  });

  test("buildFunctionExpression", () => {
    expect(buildFunctionExpression(StringFilterFunctions.LENGTH, "test")).toBe("length(test)");
    expect(buildFunctionExpression(StringFilterFunctions.CONTAINS, "Test", "ttt")).toBe("contains(Test,ttt)");
  });

  test("buildQFilterOperation", () => {
    expect(buildQFilterOperation("test", StandardFilterOperators.EQUALS, "hhh").toString()).toBe("test eq hhh");
  });

  test("getParamValue", () => {
    expect(getParamValue(undefined)).toBeUndefined();
    // null is a regular data type
    expect(getParamValue(null)).toBe("null");

    expect(getParamValue("test")).toBe("test");
    expect(getParamValue(3)).toBe("3");
    expect(getParamValue(0)).toBe("0");
    expect(getParamValue(-3.2)).toBe("-3.2");
    expect(getParamValue(true)).toBe("true");
    expect(getParamValue(false)).toBe("false");

    expect(getParamValue("test", {})).toBe("test");
  });

  test("getParamValue: quoted", () => {
    expect(getParamValue("test", quotedTest)).toBe("'test'");
    expect(getParamValue("test", { isQuoted: false })).toBe("test");
    expect(getParamValue(3, quotedTest)).toBe("'3'");
    expect(getParamValue(false, quotedTest)).toBe("'false'");
    expect(getParamValue(null, quotedTest)).toBe("null");
    expect(getParamValue(undefined, quotedTest)).toBeUndefined();
  });

  test("getParamValue: prefixed", () => {
    expect(getParamValue("test", prefixedTest)).toBe("guid'test'");
    expect(getParamValue(3, prefixedTest)).toBe("guid'3'");
    expect(getParamValue(true, prefixedTest)).toBe("guid'true'");
    expect(getParamValue(null, prefixedTest)).toBe("null");
    expect(getParamValue(undefined, prefixedTest)).toBeUndefined();
  });

  test("getParamValue: suffixed", () => {
    expect(getParamValue("test", suffixedTest)).toBe("test.mysuffix");
    expect(getParamValue(3, suffixedTest)).toBe("3.mysuffix");
    expect(getParamValue(false, suffixedTest)).toBe("false.mysuffix");
    expect(getParamValue(null, suffixedTest)).toBe("null");
    expect(getParamValue(undefined, suffixedTest)).toBeUndefined();
  });

  test("getParamValue: mutual exclusion", () => {
    const testValue = "test";
    // prefixed wins
    expect(getParamValue(testValue, { ...prefixedTest, ...suffixedTest, ...quotedTest })).toBe(
      getParamValue(testValue, prefixedTest)
    );
    // suffixed comes in second
    expect(getParamValue(testValue, { ...quotedTest, ...suffixedTest })).toBe(getParamValue(testValue, suffixedTest));
    // quoted only when the other ones are not specified
  });

  test("getExpressionValue", () => {
    expect(getExpressionValue(null)).toBe("null");
    expect(getExpressionValue(qPathTest)).toBe("qpath");
    expect(getExpressionValue("test")).toBe("test");
    expect(getExpressionValue(3)).toBe("3");
    expect(getExpressionValue(0)).toBe("0");
    expect(getExpressionValue(-3.222)).toBe("-3.222");
    expect(getExpressionValue(true)).toBe("true");
    expect(getExpressionValue(false)).toBe("false");
  });

  test("getExpressionValue: quoted", () => {
    expect(getExpressionValue(null, quotedTest)).toBe("null");
    expect(getExpressionValue(qPathTest, quotedTest)).toBe("qpath");
    expect(getExpressionValue("test", quotedTest)).toBe("'test'");
    expect(getExpressionValue(3, quotedTest)).toBe("'3'");
    expect(getExpressionValue(true, quotedTest)).toBe("'true'");
  });

  test("getExpressionValue: prefixed", () => {
    expect(getExpressionValue(null, prefixedTest)).toBe("null");
    expect(getExpressionValue(qPathTest, prefixedTest)).toBe("qpath");
    expect(getExpressionValue("test", prefixedTest)).toBe("guid'test'");
    expect(getExpressionValue(3, prefixedTest)).toBe("guid'3'");
    expect(getExpressionValue(true, prefixedTest)).toBe("guid'true'");
  });

  test("getExpressionValue: suffixed", () => {
    expect(getExpressionValue(null, suffixedTest)).toBe("null");
    expect(getExpressionValue(qPathTest, suffixedTest)).toBe("qpath");
    expect(getExpressionValue("test", suffixedTest)).toBe("test.mysuffix");
    expect(getExpressionValue(3, suffixedTest)).toBe("3.mysuffix");
    expect(getExpressionValue(true, suffixedTest)).toBe("true.mysuffix");
  });

  test("getExpressionValue: mutual exclusion", () => {
    const testValue = "test";
    // prefixed wins
    expect(getExpressionValue(testValue, { ...prefixedTest, ...suffixedTest, ...quotedTest })).toBe(
      getExpressionValue(testValue, prefixedTest)
    );
    // suffixed comes in second
    expect(getExpressionValue(testValue, { ...quotedTest, ...suffixedTest })).toBe(
      getExpressionValue(testValue, suffixedTest)
    );
    // quoted only when the other ones are not specified
  });

  test("parseParamValue", () => {
    expect(parseParamValue(undefined)).toBeUndefined();
    expect(parseParamValue("null")).toBeNull();
    expect(parseParamValue("")).toBe("");
    expect(parseParamValue("test")).toBe("test");

    expect(parseParamValue("3", createParsingRegexp())).toBe("3");
  });

  test("parseParamValue: quoted", () => {
    expect(parseParamValue(undefined, createParsingRegexp(quotedTest))).toBeUndefined();
    expect(parseParamValue("null", createParsingRegexp(quotedTest))).toBeNull();
    expect(parseParamValue("", createParsingRegexp(quotedTest))).toBe("");
    expect(parseParamValue("''", createParsingRegexp(quotedTest))).toBe("");
    expect(parseParamValue("test", createParsingRegexp(quotedTest))).toBe("test");
    expect(parseParamValue("'test'", createParsingRegexp(quotedTest))).toBe("test");
  });

  test("parseParamValue: prefixed", () => {
    expect(parseParamValue(undefined, createParsingRegexp(prefixedTest))).toBeUndefined();
    expect(parseParamValue("null", createParsingRegexp(prefixedTest))).toBeNull();
    expect(parseParamValue("", createParsingRegexp(prefixedTest))).toBe("");
    expect(parseParamValue("guid''", createParsingRegexp(prefixedTest))).toBe("");
    expect(parseParamValue("test", createParsingRegexp(prefixedTest))).toBe("test");
    expect(parseParamValue("guid'test'", createParsingRegexp(prefixedTest))).toBe("test");
  });

  test("parseParamValue: quoted", () => {
    expect(parseParamValue(undefined, createParsingRegexp(suffixedTest))).toBeUndefined();
    expect(parseParamValue("null", createParsingRegexp(suffixedTest))).toBeNull();
    expect(parseParamValue("", createParsingRegexp(suffixedTest))).toBe("");
    expect(parseParamValue(".mysuffix", createParsingRegexp(suffixedTest))).toBe("");
    expect(parseParamValue("test", createParsingRegexp(suffixedTest))).toBe("test");
    expect(parseParamValue("test.mysuffix", createParsingRegexp(suffixedTest))).toBe("test");
  });
});
