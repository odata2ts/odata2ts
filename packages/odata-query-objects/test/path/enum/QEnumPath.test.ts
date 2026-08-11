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

  test("takes a plain member list, as a string union has no runtime object", () => {
    // this is the shape `enumType: "string-union"` generates: the members as a list, since a union of
    // string literals exists only in the type system
    const members = ["Feature1", "Feature2", "Feature3"] as const;
    const fromList = new QEnumPath("feature", members);

    expect(fromList.getPath()).toBe("feature");
    // the value goes on the wire exactly as it does for the enum object
    expect(fromList.eq("Feature2").toString()).toBe(toTest.eq(FeatureEnum.Feature2).toString());
    expect(fromList.asc().toString()).toBe("feature asc");
  });

  test("fails without enum", () => {
    // @ts-expect-error
    expect(() => new QEnumPath("feature")).toThrow("QEnumPath: Enum or member list must be supplied! ");
    // @ts-expect-error
    expect(() => new QEnumPath("feature", null)).toThrow("QEnumPath: Enum or member list must be supplied! ");
    // @ts-expect-error
    expect(() => new QEnumPath("feature", undefined)).toThrow("QEnumPath: Enum or member list must be supplied! ");
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

  test("has", () => {
    const result = toTest.has(FeatureEnum.Feature2);

    expect(result.toString()).toBe("feature has 'Feature2'");
    expect(result.toString()).toBe(toTest.has("Feature2").toString());
  });

  test("has combines with the logical operators like any other expression", () => {
    const result = toTest.has(FeatureEnum.Feature1).and(toTest.has(FeatureEnum.Feature3));

    expect(result.toString()).toBe("feature has 'Feature1' and feature has 'Feature3'");
  });
});
