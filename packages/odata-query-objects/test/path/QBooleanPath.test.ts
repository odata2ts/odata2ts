import { QBooleanPath } from "../../src";

describe("QBooleanPath test", () => {
  let toTest: QBooleanPath;

  beforeEach(() => {
    toTest = new QBooleanPath("done");
  });

  test("get path", () => {
    expect(toTest.getPath()).toBe("done");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-ignore
    expect(() => new QBooleanPath(null)).toThrow();
    // @ts-ignore
    expect(() => new QBooleanPath()).toThrow();
    // @ts-ignore
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

  test("isTrue", () => {
    const result = toTest.isTrue().toString();

    expect(result).toBe("done eq true");
  });

  test("isFalse", () => {
    const result = toTest.isFalse().toString();

    expect(result).toBe("done eq false");
  });
});
