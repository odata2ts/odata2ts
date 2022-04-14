import { QStringPath } from "../../src";

describe("QStringPath test", () => {
  let toTest: QStringPath;
  let otherProp: QStringPath;

  beforeEach(() => {
    toTest = new QStringPath("Country");
    otherProp = new QStringPath("Language");
  });

  test("get path", () => {
    expect(toTest.getPath()).toBe("Country");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QStringPath(null)).toThrow();
    // @ts-expect-error
    expect(() => new QStringPath()).toThrow();
    // @ts-expect-error
    expect(() => new QStringPath(undefined)).toThrow();
    expect(() => new QStringPath("")).toThrow();
    expect(() => new QStringPath(" ")).toThrow();
  });

  test("orderBy asc", () => {
    const result = toTest.asc().toString();

    expect(result).toBe("Country asc");
    expect(result).toBe(toTest.ascending().toString());
  });

  test("orderBy desc", () => {
    const result = toTest.desc().toString();

    expect(result).toBe("Country desc");
    expect(result).toBe(toTest.descending().toString());
  });

  test("isNull", () => {
    const result = toTest.isNull();
    expect(result.toString()).toBe("Country eq null");
    expect(result.toString()).toBe(toTest.eq(null).toString());
  });

  test("isNotNull", () => {
    const result = toTest.isNotNull();
    expect(result.toString()).toBe("Country ne null");
    expect(result.toString()).toBe(toTest.ne(null).toString());
  });

  test("equals", () => {
    const value = "France";
    const result = toTest.equals(value);

    expect(result.toString()).toBe("Country eq 'France'");
    expect(result.toString()).toBe(toTest.eq(value).toString());
  });

  test("equals prop", () => {
    const value = otherProp;
    const result = toTest.equals(value);

    expect(result.toString()).toBe("Country eq Language");
    expect(result.toString()).toBe(toTest.eq(value).toString());
  });

  test("not equals", () => {
    const value = "France";
    const result = toTest.notEquals(value);

    expect(result.toString()).toBe("Country ne 'France'");
    expect(result.toString()).toBe(toTest.ne(value).toString());
  });

  test("not equals prop", () => {
    const value = otherProp;
    const result = toTest.notEquals(value);

    expect(result.toString()).toBe("Country ne Language");
    expect(result.toString()).toBe(toTest.ne(value).toString());
  });

  test("lower than", () => {
    const value = "X";
    const result = toTest.lowerThan(value);

    expect(result.toString()).toBe("Country lt 'X'");
    expect(result.toString()).toBe(toTest.lt(value).toString());
  });

  test("lower than prop", () => {
    const value = otherProp;
    const result = toTest.lowerThan(value);

    expect(result.toString()).toBe("Country lt Language");
    expect(result.toString()).toBe(toTest.lt(value).toString());
  });

  test("lower equals", () => {
    const value = "X";
    const result = toTest.lowerEquals(value);

    expect(result.toString()).toBe("Country le 'X'");
    expect(result.toString()).toBe(toTest.le(value).toString());
  });

  test("lower equals prop", () => {
    const value = otherProp;
    const result = toTest.lowerEquals(value);

    expect(result.toString()).toBe("Country le Language");
    expect(result.toString()).toBe(toTest.le(value).toString());
  });

  test("greater than", () => {
    const value = "X";
    const result = toTest.greaterThan(value);

    expect(result.toString()).toBe("Country gt 'X'");
    expect(result.toString()).toBe(toTest.gt(value).toString());
  });

  test("greater than prop", () => {
    const value = otherProp;
    const result = toTest.greaterThan(value);

    expect(result.toString()).toBe("Country gt Language");
    expect(result.toString()).toBe(toTest.gt(value).toString());
  });

  test("greater equals", () => {
    const value = "X";
    const result = toTest.greaterEquals(value);

    expect(result.toString()).toBe("Country ge 'X'");
    expect(result.toString()).toBe(toTest.ge(value).toString());
  });

  test("greater equals prop", () => {
    const value = otherProp;
    const result = toTest.greaterEquals(value);

    expect(result.toString()).toBe("Country ge Language");
    expect(result.toString()).toBe(toTest.ge(value).toString());
  });

  test("in", () => {
    const result = toTest.in("X").toString();

    expect(result).toBe("Country eq 'X'");
  });

  test("in props", () => {
    const result = toTest.in(otherProp).toString();

    expect(result).toBe("Country eq Language");
  });

  test("in with multiple", () => {
    const result = toTest.in("X", "y").toString();

    expect(result).toBe(`(Country eq 'X' or Country eq 'y')`);
  });

  test("concat prefix", () => {
    const value = "X_";
    const result = toTest.concatPrefix(value).equals("X_France");

    expect(result.toString()).toBe("concat('X_',Country) eq 'X_France'");
  });

  test("concat prefix prop", () => {
    const result = toTest.concatPrefix(otherProp).equals("X_France");

    expect(result.toString()).toBe("concat(Language,Country) eq 'X_France'");
  });

  test("concat suffix", () => {
    const value = "_X";
    const result = toTest.concatSuffix(value).equals("France_X");

    expect(result.toString()).toBe("concat(Country,'_X') eq 'France_X'");
  });

  test("concat suffix prop", () => {
    const result = toTest.concatSuffix(otherProp).equals("France_X");

    expect(result.toString()).toBe("concat(Country,Language) eq 'France_X'");
  });

  test("contains", () => {
    const result = toTest.contains("ran");

    expect(result.toString()).toBe("contains(Country,'ran')");
  });

  test("contains prop", () => {
    const result = toTest.contains(otherProp);

    expect(result.toString()).toBe("contains(Country,Language)");
  });

  test("startsWith", () => {
    const result = toTest.startsWith("Fra");

    expect(result.toString()).toBe("startswith(Country,'Fra')");
  });

  test("startsWithProp", () => {
    const result = toTest.startsWith(otherProp);

    expect(result.toString()).toBe("startswith(Country,Language)");
  });

  test("endsWith", () => {
    const result = toTest.endsWith("nce");

    expect(result.toString()).toBe("endswith(Country,'nce')");
  });

  test("endsWith prop", () => {
    const result = toTest.endsWith(otherProp);

    expect(result.toString()).toBe("endswith(Country,Language)");
  });

  test("matchesPattern", () => {
    const result = toTest.matchesPattern("[A-Za-z]+");

    expect(result.toString()).toBe("matchesPattern(Country,'[A-Za-z]+')");
  });

  test("matchesPattern prop", () => {
    const result = toTest.matchesPattern(otherProp);

    expect(result.toString()).toBe("matchesPattern(Country,Language)");
  });

  test("indexOf", () => {
    const result = toTest.indexOf("nce").equals(3);

    expect(result.toString()).toBe("indexof(Country,'nce') eq 3");
  });

  test("indexOf prop", () => {
    const result = toTest.indexOf(otherProp).equals(3);

    expect(result.toString()).toBe("indexof(Country,Language) eq 3");
  });

  test("length", () => {
    const result = toTest.length().equals(6);

    expect(result.toString()).toBe("length(Country) eq 6");
  });

  test("toLower", () => {
    const result = toTest.toLower().equals("france");

    expect(result.toString()).toBe("tolower(Country) eq 'france'");
  });

  test("toUpper", () => {
    const result = toTest.toUpper().equals("FRANCE");

    expect(result.toString()).toBe("toupper(Country) eq 'FRANCE'");
  });

  test("trim", () => {
    const result = toTest.trim().equals("France");

    expect(result.toString()).toBe("trim(Country) eq 'France'");
  });

  /**
   * We test here, that internal state has been cleared after calling functions
   * which return expressions.
   * => we only test expression returning functions
   */
  test("temporary results have been cleared", () => {
    const startWithState = () => toTest.concatPrefix("test_");
    const testWithoutState = () => expect(toTest.equals("France").toString()).toBe("Country eq 'France'");

    startWithState().equals("doesn't matter");
    testWithoutState();

    startWithState().notEquals("doesn't matter");
    testWithoutState();

    startWithState().greaterThan("doesn't matter");
    testWithoutState();

    startWithState().greaterEquals("doesn't matter");
    testWithoutState();

    startWithState().lt("doesn't matter");
    testWithoutState();

    startWithState().le("doesn't matter");
    testWithoutState();

    startWithState().contains("doesn't matter");
    testWithoutState();

    startWithState().startsWith("doesn't matter");
    testWithoutState();

    startWithState().endsWith("doesn't matter");
    testWithoutState();

    startWithState().matchesPattern("doesn't matter");
    testWithoutState();
  });
});
