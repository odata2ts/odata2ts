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
});
