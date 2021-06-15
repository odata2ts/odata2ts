import { QStringPath } from "../src/QStringPath";

describe("QStringPath test", () => {
  let toTest: QStringPath;

  beforeEach(() => {
    toTest = new QStringPath("Country");
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

  test("equals", () => {
    const value = "France";
    const result = toTest.equals(value);

    expect(result).toBe("Country eq 'France'");
    expect(result).toBe(toTest.eq(value));
  });

  test("not equals", () => {
    const value = "France";
    const result = toTest.notEquals(value);

    expect(result).toBe("Country ne 'France'");
    expect(result).toBe(toTest.ne(value));
  });

  test("lower than", () => {
    const value = "X";
    const result = toTest.lowerThan(value);

    expect(result).toBe("Country lt 'X'");
    expect(result).toBe(toTest.lt(value));
  });

  test("lower equals", () => {
    const value = "X";
    const result = toTest.lowerEquals(value);

    expect(result).toBe("Country le 'X'");
    expect(result).toBe(toTest.le(value));
  });

  test("greater than", () => {
    const value = "X";
    const result = toTest.greaterThan(value);

    expect(result).toBe("Country gt 'X'");
    expect(result).toBe(toTest.gt(value));
  });

  test("greater equals", () => {
    const value = "X";
    const result = toTest.greaterEquals(value);

    expect(result).toBe("Country ge 'X'");
    expect(result).toBe(toTest.ge(value));
  });

  test("concat prefix", () => {
    const value = "X_";
    const result = toTest.concatPrefix(value).equals("X_France");

    expect(result).toBe("concat('X_',Country) eq 'X_France'");
  });

  test("concat suffix", () => {
    const value = "_X";
    const result = toTest.concatSuffix(value).equals("France_X");

    expect(result).toBe("concat(Country,'_X') eq 'France_X'");
  });

  test("contains", () => {
    const result = toTest.contains("ran");

    expect(result).toBe("contains(Country,'ran')");
  });

  test("startsWith", () => {
    const result = toTest.startsWith("Fra");

    expect(result).toBe("startswith(Country,'Fra')");
  });

  test("endsWith", () => {
    const result = toTest.endsWith("nce");

    expect(result).toBe("endswith(Country,'nce')");
  });

  test("matchesPattern", () => {
    const result = toTest.matchesPattern("[A-Za-z]+");

    expect(result).toBe("matchesPattern(Country,'[A-Za-z]+')");
  });

  /*
  test("indexOf", () => {
    const result = toTest.indexOf("nce").equals(3);

    expect(result).toBe("indexof(Country,'nce') eq 3");
  });

  test("length", () => {
    const result = toTest.length().equals(6);

    expect(result).toBe("length(Country) eq 6");
  });
  */

  test("toLower", () => {
    const result = toTest.toLower().equals("france");

    expect(result).toBe("tolower(Country) eq 'france'");
  });

  test("toUpper", () => {
    const result = toTest.toUpper().equals("FRANCE");

    expect(result).toBe("toupper(Country) eq 'FRANCE'");
  });

  test("trim", () => {
    const result = toTest.trim().equals("France");

    expect(result).toBe("trim(Country) eq 'France'");
  });
});
