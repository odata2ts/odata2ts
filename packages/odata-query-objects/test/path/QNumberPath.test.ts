import { QNumberPath } from "../../src/";

describe("QNumberPath test", () => {
  let toTest: QNumberPath;

  beforeEach(() => {
    toTest = new QNumberPath("Price");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-ignore
    expect(() => new QNumberPath(null)).toThrow();
    // @ts-ignore
    expect(() => new QNumberPath()).toThrow();
    // @ts-ignore
    expect(() => new QNumberPath(undefined)).toThrow();
    expect(() => new QNumberPath("")).toThrow();
    expect(() => new QNumberPath(" ")).toThrow();
  });

  test("equals", () => {
    const value = 42;
    const result = toTest.equals(value);

    expect(result.toString()).toBe("Price eq 42");
    expect(result.toString()).toBe(toTest.eq(value).toString());
  });

  test("not equals", () => {
    const value = 42;
    const result = toTest.notEquals(value);

    expect(result.toString()).toBe("Price ne 42");
    expect(result.toString()).toBe(toTest.ne(value).toString());
  });

  test("lower than", () => {
    const value = 42;
    const result = toTest.lowerThan(value);

    expect(result.toString()).toBe("Price lt 42");
    expect(result.toString()).toBe(toTest.lt(value).toString());
  });

  test("lower equals", () => {
    const value = 42;
    const result = toTest.lowerEquals(value);

    expect(result.toString()).toBe("Price le 42");
    expect(result.toString()).toBe(toTest.le(value).toString());
  });

  test("greater than", () => {
    const value = 42;
    const result = toTest.greaterThan(value);

    expect(result.toString()).toBe("Price gt 42");
    expect(result.toString()).toBe(toTest.gt(value).toString());
  });

  test("greater equals", () => {
    const value = 42;
    const result = toTest.greaterEquals(value);

    expect(result.toString()).toBe("Price ge 42");
    expect(result.toString()).toBe(toTest.ge(value).toString());
  });

  test("plus", () => {
    const value = 42;
    const result = toTest.plus(value).equals(44);

    expect(result.toString()).toBe("Price add 42 eq 44");
    expect(result.toString()).toBe(toTest.add(value).equals(44).toString());
  });

  test("minus", () => {
    const value = 42;
    const result = toTest.minus(value).equals(44);

    expect(result.toString()).toBe("Price sub 42 eq 44");
    expect(result.toString()).toBe(toTest.sub(value).equals(44).toString());
  });

  test("multiply", () => {
    const value = 42;
    const result = toTest.multiply(value).equals(44);

    expect(result.toString()).toBe("Price mul 42 eq 44");
    expect(result.toString()).toBe(toTest.mul(value).equals(44).toString());
  });

  test("divide", () => {
    const value = 42;
    const result = toTest.divide(value).equals(44);

    expect(result.toString()).toBe("Price div 42 eq 44");
    expect(result.toString()).toBe(toTest.div(value).equals(44).toString());
  });

  test("divide with fraction", () => {
    const value = 42;
    const result = toTest.divideWithFraction(value).equals(44);

    expect(result.toString()).toBe("Price divby 42 eq 44");
    expect(result.toString()).toBe(toTest.divBy(value).equals(44).toString());
  });

  test("modulo", () => {
    const value = 42;
    const result = toTest.modulo(value).equals(44);

    expect(result.toString()).toBe("Price mod 42 eq 44");
    expect(result.toString()).toBe(toTest.mod(value).equals(44).toString());
  });

  test("ceiling", () => {
    const result = toTest.ceiling().equals(5);

    expect(result.toString()).toBe("ceiling(Price) eq 5");
  });

  test("floor", () => {
    const result = toTest.floor().equals(5);

    expect(result.toString()).toBe("floor(Price) eq 5");
  });

  test("round", () => {
    const result = toTest.round().equals(5);

    expect(result.toString()).toBe("round(Price) eq 5");
  });

  /**
   * We test here, that internal state has been cleared after calling functions
   * which return expressions.
   * => we only test expression returning functions
   */
  test("temporary results have been cleared", () => {
    const startWithState = () => toTest.plus(3);
    const testWithoutState = () => expect(toTest.equals(5).toString()).toBe("Price eq 5");

    startWithState().equals(5);
    testWithoutState();

    startWithState().notEquals(5);
    testWithoutState();

    startWithState().greaterThan(5);
    testWithoutState();

    startWithState().greaterEquals(5);
    testWithoutState();

    startWithState().lt(5);
    testWithoutState();

    startWithState().le(5);
    testWithoutState();
  });
});
