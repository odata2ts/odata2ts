import { QEnumPath } from "../../src";

describe("QEnumPath test", () => {
  let toTest: QEnumPath;
  const enum FeatureEnum {
    Feature1 = "Feature1",
    Feature2 = "Feature2",
    Feature3 = "Feature3",
  }

  beforeEach(() => {
    toTest = new QEnumPath("feature");
  });

  test("get path", () => {
    expect(toTest.getPath()).toBe("feature");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QEnumPath(null)).toThrow();
    // @ts-expect-error
    expect(() => new QEnumPath()).toThrow();
    // @ts-expect-error
    expect(() => new QEnumPath(undefined)).toThrow();
    expect(() => new QEnumPath("")).toThrow();
    expect(() => new QEnumPath(" ")).toThrow();
  });

  test("orderBy asc", () => {
    const result = toTest.asc().toString();

    expect(result).toBe("feature asc");
    expect(result).toBe(toTest.ascending().toString());
  });

  test("orderBy desc", () => {
    const result = toTest.desc().toString();

    expect(result).toBe("feature desc");
    expect(result).toBe(toTest.descending().toString());
  });

  test("equals", () => {
    const value = "Feature1";
    const result = toTest.equals(value);

    expect(result.toString()).toBe("feature eq 'Feature1'");
    expect(result.toString()).toBe(toTest.eq(value).toString());
  });

  test("not equals", () => {
    const value = "Feature1";
    const result = toTest.notEquals(value);

    expect(result.toString()).toBe("feature ne 'Feature1'");
    expect(result.toString()).toBe(toTest.ne(value).toString());
  });

  test("in", () => {
    const result = toTest.in("X").toString();

    expect(result).toBe("feature eq 'X'");
  });

  test("in with multiple", () => {
    const result = toTest.in("X", "y").toString();

    expect(result).toBe(`(feature eq 'X' or feature eq 'y')`);
  });
});
