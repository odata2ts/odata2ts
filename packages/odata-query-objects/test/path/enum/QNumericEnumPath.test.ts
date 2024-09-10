import { describe, expect, test } from "vitest";
import { QNumericEnumPath } from "../../../src";

describe("QNumericEnumPath test", () => {
  enum FeatureEnum {
    Feature1,
    Feature2 = 5,
    Feature3,
  }
  let toTest = new QNumericEnumPath("feature", FeatureEnum);

  test("get path", () => {
    expect(toTest.getPath()).toBe("feature");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QNumericEnumPath(null, FeatureEnum)).toThrow();
    // @ts-expect-error
    expect(() => new QNumericEnumPath(undefined, FeatureEnum)).toThrow();
    expect(() => new QNumericEnumPath("", FeatureEnum)).toThrow();
    expect(() => new QNumericEnumPath(" ", FeatureEnum)).toThrow();
  });

  test("fails without enum", () => {
    // @ts-expect-error
    expect(() => new QNumericEnumPath("feature")).toThrow();
    // @ts-expect-error
    expect(() => new QNumericEnumPath("feature", null)).toThrow();
    // @ts-expect-error
    expect(() => new QNumericEnumPath("feature", undefined)).toThrow();
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
    const value = FeatureEnum.Feature1;
    const result = toTest.equals(value);
    const result2 = toTest.equals(0);

    expect(result.toString()).toBe(result2.toString());
    expect(result.toString()).toBe("feature eq 'Feature1'");
    expect(result.toString()).toBe(toTest.eq(0).toString());
  });

  test("not equals", () => {
    const value = FeatureEnum.Feature1;
    const result = toTest.notEquals(value);
    const result2 = toTest.notEquals(0);

    expect(result.toString()).toBe(result2.toString());
    expect(result.toString()).toBe("feature ne 'Feature1'");
    expect(result.toString()).toBe(toTest.ne(0).toString());
  });

  test("in", () => {
    const result = toTest.in(FeatureEnum.Feature1).toString();

    expect(result).toBe("feature eq 'Feature1'");
  });

  test("in with multiple", () => {
    const result = toTest.in(0, FeatureEnum.Feature2).toString();

    expect(result).toBe(`(feature eq 'Feature1' or feature eq 'Feature2')`);
  });

  test.only("fails with non enum values", () => {
    // @ts-expect-error
    toTest.eq(99);
  });
});
