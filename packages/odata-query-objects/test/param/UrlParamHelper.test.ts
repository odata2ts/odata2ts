import {
  NumberFilterOperators,
  QPathModel,
  StandardFilterOperators,
  StringFilterFunctions,
  buildFunctionExpression,
  buildOperatorExpression,
  buildQFilterOperation,
  formatLiteral,
  formatLiteralParam,
  formatParamWithQuotes,
  formatParamWithTypePrefix,
  formatParamWithTypeSuffix,
  formatWithQuotes,
  formatWithTypePrefix,
  formatWithTypeSuffix,
  isPathValue,
  parseLiteral,
  parseWithQuotes,
  parseWithTypePrefix,
  parseWithTypeSuffix,
} from "../../src";

describe("UrlParamHelper Tests", () => {
  const qPathTest: QPathModel = {
    getPath: () => "qpath",
  };

  test("formatLiteral", () => {
    expect(formatLiteral("test")).toBe("test");
    expect(formatLiteral(3)).toBe("3");
    expect(formatLiteral(0)).toBe("0");
    expect(formatLiteral(-3.2)).toBe("-3.2");
    expect(formatLiteral(true)).toBe("true");
    expect(formatLiteral(false)).toBe("false");
  });

  test("formatLiteralParam", () => {
    expect(formatLiteralParam(0)).toBe("0");
    expect(formatLiteralParam(null)).toBe("null");
    expect(formatLiteralParam(undefined)).toBeUndefined();
  });

  test("parseLiteral", () => {
    expect(parseLiteral("test")).toBe("test");
    expect(parseLiteral("3")).toBe("3");
    expect(parseLiteral("0")).toBe("0");
    expect(parseLiteral("-3.2")).toBe("-3.2");
    expect(parseLiteral("true")).toBe("true");
    expect(parseLiteral("false")).toBe("false");

    expect(parseLiteral(undefined)).toBeUndefined();

    // @ts-expect-error
    expect(parseLiteral(null)).toBe(null);
  });

  test("formatWithTypePrefix", () => {
    expect(formatWithTypePrefix("PRE", "test")).toBe("PRE'test'");
    expect(formatWithTypePrefix("PRE", 3)).toBe("PRE'3'");
    expect(formatWithTypePrefix("PRE", false)).toBe("PRE'false'");
  });

  test("formatParamWithTypePrefix", () => {
    expect(formatParamWithTypePrefix("PRE", 0)).toBe("PRE'0'");
    expect(formatParamWithTypePrefix("PRE", null)).toBe("null");
    expect(formatParamWithTypePrefix("PRE", undefined)).toBeUndefined();
  });

  test("parseWithTypePrefix", () => {
    expect(parseWithTypePrefix("guid", "guid''")).toBe("");
    expect(parseWithTypePrefix("guid", "guid'ABA'")).toBe("ABA");
    expect(parseWithTypeSuffix("guid", "null")).toBe(null);
    expect(parseWithTypePrefix("guid", undefined)).toBeUndefined();

    // strict parsing: throw error if pattern doesn't match
    expect(() => parseWithTypePrefix("guid", "test")).toThrow();
    expect(() => parseWithTypePrefix("guid", "guid'test")).toThrow();
    expect(() => parseWithTypePrefix("guid", "guidtest'")).toThrow();

    // @ts-expect-error
    expect(parseWithTypePrefix("SUF", null)).toBe(null);
  });

  test("formatWithTypeSuffix", () => {
    expect(formatWithTypeSuffix("SUF", "test")).toBe("testSUF");
    expect(formatWithTypeSuffix("suf", 3)).toBe("3suf");
    expect(formatWithTypeSuffix("SUF", false)).toBe("falseSUF");
  });

  test("formatParamWithTypeSuffix", () => {
    expect(formatParamWithTypeSuffix("SUF", 0)).toBe("0SUF");
    expect(formatParamWithTypeSuffix("SUF", null)).toBe("null");
    expect(formatParamWithTypeSuffix("SUF", undefined)).toBeUndefined();
  });

  test("parseWithTypeSuffix", () => {
    expect(parseWithTypeSuffix("SUF", "SUF")).toBe("");
    expect(parseWithTypeSuffix("SUF", "testSUF")).toBe("test");
    expect(parseWithTypeSuffix("SUF", "null")).toBe(null);
    expect(parseWithTypeSuffix("SUF", undefined)).toBeUndefined();

    // lenient parsing: not throwing errors
    expect(parseWithTypeSuffix("SUF", "test")).toBe("test");

    // @ts-expect-error
    expect(parseWithTypeSuffix("SUF", null)).toBe(null);
  });

  test("formatWithQuotes", () => {
    expect(formatWithQuotes("test")).toBe("'test'");
    expect(formatWithQuotes(3)).toBe("'3'");
    expect(formatWithQuotes(false)).toBe("'false'");
  });

  test("formatParamWithQuotes", () => {
    expect(formatParamWithQuotes(0)).toBe("'0'");
    expect(formatParamWithQuotes(null)).toBe("null");
    expect(formatParamWithQuotes(undefined)).toBeUndefined();
  });

  test("parseWithQuotes", () => {
    expect(parseWithQuotes("''")).toBe("");
    expect(parseWithQuotes("'AbA'")).toBe("AbA");
    expect(parseWithQuotes("null")).toBe(null);
    expect(parseWithQuotes(undefined)).toBeUndefined();

    expect(parseWithQuotes("'Ab'ddd'A'")).toBe("Ab'ddd'A");

    // strict parsing: throw error if pattern doesn't match
    expect(() => parseWithQuotes("")).toThrow();
    expect(() => parseWithQuotes("test")).toThrow();
    expect(() => parseWithQuotes("'tes't")).toThrow();
    expect(() => parseWithQuotes("test'")).toThrow();
    expect(() => parseWithQuotes("t''est")).toThrow();

    // @ts-expect-error
    expect(parseWithQuotes(null)).toBe(null);
  });

  test("isPathValue", () => {
    expect(isPathValue(qPathTest)).toBe(true);

    expect(isPathValue("test")).toBe(false);
    expect(isPathValue(3)).toBe(false);
    expect(isPathValue(false)).toBe(false);
    expect(isPathValue(null)).toBe(false);
    expect(isPathValue(undefined)).toBe(false);
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
});
