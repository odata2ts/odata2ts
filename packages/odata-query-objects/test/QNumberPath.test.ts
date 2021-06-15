import { QNumberPath } from "../src/QNumberPath";

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

    expect(result).toBe("Price eq 42");
    expect(result).toBe(toTest.eq(value));
  });

  test("not equals", () => {
    const value = 42;
    const result = toTest.notEquals(value);

    expect(result).toBe("Price ne 42");
    expect(result).toBe(toTest.ne(value));
  });

  test("lower than", () => {
    const value = 42;
    const result = toTest.lowerThan(value);

    expect(result).toBe("Price lt 42");
    expect(result).toBe(toTest.lt(value));
  });

  test("lower equals", () => {
    const value = 42;
    const result = toTest.lowerEquals(value);

    expect(result).toBe("Price le 42");
    expect(result).toBe(toTest.le(value));
  });

  test("greater than", () => {
    const value = 42;
    const result = toTest.greaterThan(value);

    expect(result).toBe("Price gt 42");
    expect(result).toBe(toTest.gt(value));
  });

  test("greater equals", () => {
    const value = 42;
    const result = toTest.greaterEquals(value);

    expect(result).toBe("Price ge 42");
    expect(result).toBe(toTest.ge(value));
  });

  test("plus", () => {
    const value = 42;
    const result = toTest.plus(value).equals(44);

    expect(result).toBe("Price add 42 eq 44");
    expect(result).toBe(toTest.add(value).equals(44));
  });

  test("minus", () => {
    const value = 42;
    const result = toTest.minus(value).equals(44);

    expect(result).toBe("Price sub 42 eq 44");
    expect(result).toBe(toTest.sub(value).equals(44));
  });

  test("multiply", () => {
    const value = 42;
    const result = toTest.multiply(value).equals(44);

    expect(result).toBe("Price mul 42 eq 44");
    expect(result).toBe(toTest.mul(value).equals(44));
  });

  test("divide", () => {
    const value = 42;
    const result = toTest.divide(value).equals(44);

    expect(result).toBe("Price div 42 eq 44");
    expect(result).toBe(toTest.div(value).equals(44));
  });

  test("divide with fraction", () => {
    const value = 42;
    const result = toTest.divideWithFraction(value).equals(44);

    expect(result).toBe("Price divby 42 eq 44");
    expect(result).toBe(toTest.divBy(value).equals(44));
  });

  test("modulo", () => {
    const value = 42;
    const result = toTest.modulo(value).equals(44);

    expect(result).toBe("Price mod 42 eq 44");
    expect(result).toBe(toTest.mod(value).equals(44));
  });

  test("ceiling", () => {
    const result = toTest.ceiling().equals(5);

    expect(result).toBe("ceiling(Price) eq 5");
  });

  test("floor", () => {
    const result = toTest.floor().equals(5);

    expect(result).toBe("floor(Price) eq 5");
  });

  test("round", () => {
    const result = toTest.round().equals(5);

    expect(result).toBe("round(Price) eq 5");
  });

  test("temporary results have been cleared", () => {
    const startWithState = () => toTest.plus(3);
    const testWithoutState = () => expect(toTest.equals(5)).toBe("Price eq 5");

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
