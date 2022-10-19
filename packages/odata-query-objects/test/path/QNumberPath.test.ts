import { numberToStringConverter } from "@odata2ts/test-converters";

import { QNumberPath } from "../../src/";

describe("QNumberPath test", () => {
  let toTest: QNumberPath;
  let otherProp: QNumberPath;

  beforeEach(() => {
    toTest = new QNumberPath("Price");
    otherProp = new QNumberPath("Budget");
  });

  test("get path", () => {
    expect(toTest.getPath()).toBe("Price");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QNumberPath(null)).toThrow();
    // @ts-expect-error
    expect(() => new QNumberPath()).toThrow();
    // @ts-expect-error
    expect(() => new QNumberPath(undefined)).toThrow();
    expect(() => new QNumberPath("")).toThrow();
    expect(() => new QNumberPath(" ")).toThrow();
  });

  test("with converter", () => {
    const testWithConv = new QNumberPath("ID", numberToStringConverter);

    // based on the converter, the user can now input strings instead of numbers
    expect(testWithConv.gt("12").toString()).toBe(`ID gt 12`);
  });

  test("orderBy asc", () => {
    const result = toTest.asc().toString();

    expect(result).toBe("Price asc");
    expect(result).toBe(toTest.ascending().toString());
  });

  test("orderBy desc", () => {
    const result = toTest.desc().toString();

    expect(result).toBe("Price desc");
    expect(result).toBe(toTest.descending().toString());
  });

  test("isNull", () => {
    const result = toTest.isNull().toString();

    expect(result).toBe("Price eq null");
  });

  test("isNotNull", () => {
    const result = toTest.isNotNull().toString();

    expect(result).toBe("Price ne null");
  });

  test("equals", () => {
    const value = 42;
    const result = toTest.equals(value);

    expect(result.toString()).toBe("Price eq 42");
    expect(result.toString()).toBe(toTest.eq(value).toString());
  });

  test("equals prop", () => {
    const value = otherProp;
    const result = toTest.equals(value);

    expect(result.toString()).toBe("Price eq Budget");
    expect(result.toString()).toBe(toTest.eq(value).toString());
  });

  test("not equals", () => {
    const value = 42;
    const result = toTest.notEquals(value);

    expect(result.toString()).toBe("Price ne 42");
    expect(result.toString()).toBe(toTest.ne(value).toString());
  });

  test("not equals prop", () => {
    const value = otherProp;
    const result = toTest.notEquals(value);

    expect(result.toString()).toBe("Price ne Budget");
    expect(result.toString()).toBe(toTest.ne(value).toString());
  });

  test("lower than", () => {
    const value = 42;
    const result = toTest.lowerThan(value);

    expect(result.toString()).toBe("Price lt 42");
    expect(result.toString()).toBe(toTest.lt(value).toString());
  });

  test("lower than prop", () => {
    const value = otherProp;
    const result = toTest.lowerThan(value);

    expect(result.toString()).toBe("Price lt Budget");
    expect(result.toString()).toBe(toTest.lt(value).toString());
  });

  test("lower equals", () => {
    const value = 42;
    const result = toTest.lowerEquals(value);

    expect(result.toString()).toBe("Price le 42");
    expect(result.toString()).toBe(toTest.le(value).toString());
  });

  test("lower equals prop", () => {
    const value = otherProp;
    const result = toTest.lowerEquals(value);

    expect(result.toString()).toBe("Price le Budget");
    expect(result.toString()).toBe(toTest.le(value).toString());
  });

  test("greater than", () => {
    const value = 42;
    const result = toTest.greaterThan(value);

    expect(result.toString()).toBe("Price gt 42");
    expect(result.toString()).toBe(toTest.gt(value).toString());
  });

  test("greater than prop", () => {
    const value = otherProp;
    const result = toTest.greaterThan(value);

    expect(result.toString()).toBe("Price gt Budget");
    expect(result.toString()).toBe(toTest.gt(value).toString());
  });

  test("greater equals", () => {
    const value = 42;
    const result = toTest.greaterEquals(value);

    expect(result.toString()).toBe("Price ge 42");
    expect(result.toString()).toBe(toTest.ge(value).toString());
  });

  test("greater equals prop", () => {
    const value = otherProp;
    const result = toTest.greaterEquals(value);

    expect(result.toString()).toBe("Price ge Budget");
    expect(result.toString()).toBe(toTest.ge(value).toString());
  });

  test("in", () => {
    const result = toTest.in(42).toString();

    expect(result).toBe("Price eq 42");
  });

  test("in prop", () => {
    const result = toTest.in(otherProp).toString();

    expect(result).toBe("Price eq Budget");
  });

  test("in with multiple", () => {
    const result = toTest.in(42, 44).toString();

    expect(result).toBe(`(Price eq 42 or Price eq 44)`);
  });

  test("plus", () => {
    const value = 42;
    const result = toTest.plus(value).equals(44);

    expect(result.toString()).toBe("Price add 42 eq 44");
    expect(result.toString()).toBe(toTest.add(value).equals(44).toString());
  });

  test("plus prop", () => {
    const value = otherProp;
    const result = toTest.plus(value).equals(44);

    expect(result.toString()).toBe("Price add Budget eq 44");
    expect(result.toString()).toBe(toTest.add(value).equals(44).toString());
  });

  test("minus", () => {
    const value = 42;
    const result = toTest.minus(value).equals(44);

    expect(result.toString()).toBe("Price sub 42 eq 44");
    expect(result.toString()).toBe(toTest.sub(value).equals(44).toString());
  });

  test("minus prop", () => {
    const value = otherProp;
    const result = toTest.minus(value).equals(44);

    expect(result.toString()).toBe("Price sub Budget eq 44");
    expect(result.toString()).toBe(toTest.sub(value).equals(44).toString());
  });

  test("multiply", () => {
    const value = 42;
    const result = toTest.multiply(value).equals(44);

    expect(result.toString()).toBe("Price mul 42 eq 44");
    expect(result.toString()).toBe(toTest.mul(value).equals(44).toString());
  });

  test("multiply prop", () => {
    const value = otherProp;
    const result = toTest.multiply(value).equals(44);

    expect(result.toString()).toBe("Price mul Budget eq 44");
    expect(result.toString()).toBe(toTest.mul(value).equals(44).toString());
  });

  test("divide", () => {
    const value = 42;
    const result = toTest.divide(value).equals(44);

    expect(result.toString()).toBe("Price div 42 eq 44");
    expect(result.toString()).toBe(toTest.div(value).equals(44).toString());
  });

  test("divide prop", () => {
    const value = otherProp;
    const result = toTest.divide(value).equals(44);

    expect(result.toString()).toBe("Price div Budget eq 44");
    expect(result.toString()).toBe(toTest.div(value).equals(44).toString());
  });

  test("divide with fraction", () => {
    const value = 42;
    const result = toTest.divideWithFraction(value).equals(44);

    expect(result.toString()).toBe("Price divby 42 eq 44");
    expect(result.toString()).toBe(toTest.divBy(value).equals(44).toString());
  });

  test("divide with fraction prop", () => {
    const value = otherProp;
    const result = toTest.divideWithFraction(value).equals(44);

    expect(result.toString()).toBe("Price divby Budget eq 44");
    expect(result.toString()).toBe(toTest.divBy(value).equals(44).toString());
  });

  test("modulo", () => {
    const value = 42;
    const result = toTest.modulo(value).equals(44);

    expect(result.toString()).toBe("Price mod 42 eq 44");
    expect(result.toString()).toBe(toTest.mod(value).equals(44).toString());
  });

  test("modulo prop", () => {
    const value = otherProp;
    const result = toTest.modulo(value).equals(44);

    expect(result.toString()).toBe("Price mod Budget eq 44");
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
