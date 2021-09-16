import { QStringPath } from "../../src";

describe("QStringPath test", () => {
  let toTest: QStringPath;

  beforeEach(() => {
    toTest = new QStringPath("Country");
  });

  test("get path", () => {
    expect(toTest.getPath()).toBe("Country");
    expect(toTest.withPath("new").getPath()).toBe("new");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-ignore
    expect(() => new QStringPath(null)).toThrow();
    // @ts-ignore
    expect(() => new QStringPath()).toThrow();
    // @ts-ignore
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

  test("equals", () => {
    const value = "France";
    const result = toTest.equals(value);

    expect(result.toString()).toBe("Country eq 'France'");
    expect(result.toString()).toBe(toTest.eq(value).toString());
  });

  test("not equals", () => {
    const value = "France";
    const result = toTest.notEquals(value);

    expect(result.toString()).toBe("Country ne 'France'");
    expect(result.toString()).toBe(toTest.ne(value).toString());
  });

  test("lower than", () => {
    const value = "X";
    const result = toTest.lowerThan(value);

    expect(result.toString()).toBe("Country lt 'X'");
    expect(result.toString()).toBe(toTest.lt(value).toString());
  });

  test("lower equals", () => {
    const value = "X";
    const result = toTest.lowerEquals(value);

    expect(result.toString()).toBe("Country le 'X'");
    expect(result.toString()).toBe(toTest.le(value).toString());
  });

  test("greater than", () => {
    const value = "X";
    const result = toTest.greaterThan(value);

    expect(result.toString()).toBe("Country gt 'X'");
    expect(result.toString()).toBe(toTest.gt(value).toString());
  });

  test("greater equals", () => {
    const value = "X";
    const result = toTest.greaterEquals(value);

    expect(result.toString()).toBe("Country ge 'X'");
    expect(result.toString()).toBe(toTest.ge(value).toString());
  });

  test("in", () => {
    const result = toTest.in("X").toString();

    expect(result).toBe("Country eq 'X'");
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

  test("concat suffix", () => {
    const value = "_X";
    const result = toTest.concatSuffix(value).equals("France_X");

    expect(result.toString()).toBe("concat(Country,'_X') eq 'France_X'");
  });

  test("contains", () => {
    const result = toTest.contains("ran");

    expect(result.toString()).toBe("contains(Country,'ran')");
  });

  test("startsWith", () => {
    const result = toTest.startsWith("Fra");

    expect(result.toString()).toBe("startswith(Country,'Fra')");
  });

  test("endsWith", () => {
    const result = toTest.endsWith("nce");

    expect(result.toString()).toBe("endswith(Country,'nce')");
  });

  test("matchesPattern", () => {
    const result = toTest.matchesPattern("[A-Za-z]+");

    expect(result.toString()).toBe("matchesPattern(Country,'[A-Za-z]+')");
  });

  test("indexOf", () => {
    const result = toTest.indexOf("nce").equals(3);

    expect(result.toString()).toBe("indexof(Country,'nce') eq 3");
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
