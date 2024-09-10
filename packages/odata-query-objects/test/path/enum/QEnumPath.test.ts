import { describe, expect, test } from "vitest";
import { QEnumPath } from "../../../src";

describe("QEnumPath test", () => {
  enum FeatureEnum {
    Feature1 = "Feature1",
    Feature2 = "Feature2",
    Feature3 = "Feature3",
  }
  const toTest = new QEnumPath("feature", FeatureEnum);

  test("get path", () => {
    expect(toTest.getPath()).toBe("feature");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QEnumPath(null, FeatureEnum)).toThrow();
    // @ts-expect-error
    expect(() => new QEnumPath(undefined, FeatureEnum)).toThrow();
    expect(() => new QEnumPath("", FeatureEnum)).toThrow();
    expect(() => new QEnumPath(" ", FeatureEnum)).toThrow();
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
    const value = "Feature1";
    const result = toTest.equals(FeatureEnum.Feature1);
    const result2 = toTest.equals("Feature1");

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
    const result = toTest.in(FeatureEnum.Feature3).toString();

    expect(result).toBe("feature eq 'Feature3'");
  });

  test("in with multiple", () => {
    const result = toTest.in("Feature2", FeatureEnum.Feature3).toString();

    expect(result).toBe(`(feature eq 'Feature2' or feature eq 'Feature3')`);
  });
});
