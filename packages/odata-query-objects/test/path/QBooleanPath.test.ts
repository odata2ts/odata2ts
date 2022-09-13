import { QBooleanPath } from "../../src";

describe("QBooleanPath test", () => {
  let toTest = new QBooleanPath("done");

  test("get path", () => {
    expect(toTest.getPath()).toBe("done");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QBooleanPath(null)).toThrow();
    // @ts-expect-error
    expect(() => new QBooleanPath()).toThrow();
    // @ts-expect-error
    expect(() => new QBooleanPath(undefined)).toThrow();
    expect(() => new QBooleanPath("")).toThrow();
    expect(() => new QBooleanPath(" ")).toThrow();
  });

  test("orderBy asc", () => {
    const result = toTest.asc().toString();

    expect(result).toBe("done asc");
    expect(result).toBe(toTest.ascending().toString());
  });

  test("orderBy desc", () => {
    const result = toTest.desc().toString();

    expect(result).toBe("done desc");
    expect(result).toBe(toTest.descending().toString());
  });

  test("equals", () => {
    const value = true;
    const result = toTest.equals(value).toString();

    expect(result).toBe("done eq true");
    expect(result).toBe(toTest.eq(value).toString());
  });

  test("not equals", () => {
    const value = true;
    const result = toTest.notEquals(value).toString();

    expect(result).toBe("done ne true");
    expect(result).toBe(toTest.ne(value).toString());
  });

  test("equals other path", () => {
    const otherPath = new QBooleanPath("Test");

    expect(toTest.equals(otherPath).toString()).toBe("done eq Test");
    expect(toTest.ne(otherPath).toString()).toBe("done ne Test");
  });

  test("equals fails with null or undefined", () => {
    // @ts-expect-error
    expect(() => toTest.equals(null)).toThrow();
    // @ts-expect-error
    expect(() => toTest.equals(undefined)).toThrow();
  });

  test("isTrue", () => {
    const result = toTest.isTrue().toString();

    expect(result).toBe("done eq true");
  });

  test("isFalse", () => {
    const result = toTest.isFalse().toString();

    expect(result).toBe("done eq false");
  });
});
