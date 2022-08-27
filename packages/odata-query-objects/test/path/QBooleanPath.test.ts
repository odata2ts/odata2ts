import { QBooleanPath } from "../../src";

describe("QBooleanPath test", () => {
  let toTest: QBooleanPath;

  beforeEach(() => {
    toTest = new QBooleanPath("done");
  });

  test("get URL conform value", () => {
    expect(QBooleanPath.getUrlConformValue(true)).toBe("true");
    expect(QBooleanPath.getUrlConformValue(false)).toBe("false");
  });

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

  test("isTrue", () => {
    const result = toTest.isTrue().toString();

    expect(result).toBe("done eq true");
  });

  test("isFalse", () => {
    const result = toTest.isFalse().toString();

    expect(result).toBe("done eq false");
  });
});
