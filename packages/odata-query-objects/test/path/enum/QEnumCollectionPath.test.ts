import { describe, expect, test } from "vitest";
import { QEnumCollection, QEnumCollectionPath, QEnumPath, QFilterExpression } from "../../../src";

describe("QEnumCollectionPath test", () => {
  enum FeatureEnum {
    Feature1 = "Feature1",
    Feature2 = "Feature2",
    Feature3 = "Feature3",
  }
  const toTest = new QEnumCollectionPath("features", FeatureEnum);

  test("basics", () => {
    expect(toTest.getPath()).toBe("features");
    expect(toTest.isCollectionType()).toBeTruthy();

    let entity = toTest.getEntity();
    expect(entity).toBeInstanceOf(QEnumCollection);
    expect(entity.it).toBeInstanceOf(QEnumPath);
    expect(entity.it.getPath()).toBe("$it");

    entity = toTest.getEntity(true);
    expect(entity.it.getPath()).toBe("features/$it");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QEnumCollectionPath(null, FeatureEnum)).toThrow();
    // @ts-expect-error
    expect(() => new QEnumCollectionPath(undefined, FeatureEnum)).toThrow();
    expect(() => new QEnumCollectionPath("", FeatureEnum)).toThrow();
    expect(() => new QEnumCollectionPath(" ", FeatureEnum)).toThrow();
  });

  test("fails without enum", () => {
    // @ts-expect-error
    expect(() => new QEnumCollectionPath("features")).toThrow();
    // @ts-expect-error
    expect(() => new QEnumCollectionPath("features", null)).toThrow();
    // @ts-expect-error
    expect(() => new QEnumCollectionPath("features", undefined)).toThrow();
  });

  test("any filter", () => {
    const result = toTest.any((qTest) => qTest.it.eq(FeatureEnum.Feature1)).toString();
    expect(result).toBe("features/any(a:a eq 'Feature1')");
  });

  test("empty any filter", () => {
    expect(toTest.any().toString()).toBe("features/any()");
    expect(toTest.any(() => {}).toString()).toBe("features/any()");
    expect(toTest.any(() => new QFilterExpression()).toString()).toBe("features/any()");
  });

  test("multiple any filter", () => {
    const result = toTest.any((qTest) => qTest.it.equals(FeatureEnum.Feature2).and(qTest.it.eq(FeatureEnum.Feature3)));
    expect(result.toString()).toBe("features/any(a:a eq 'Feature2' and a eq 'Feature3')");
  });

  test("any with prefix", () => {
    const result = toTest.any((qTest) => qTest.it.eq(FeatureEnum.Feature1), "testing").toString();
    expect(result).toBe("features/any(testing:testing eq 'Feature1')");
  });

  test("all filter", () => {
    const result = toTest.all((qTest) => qTest.it.eq(FeatureEnum.Feature1)).toString();
    expect(result).toBe("features/all(a:a eq 'Feature1')");
  });

  test("empty all filter", () => {
    expect(toTest.all().toString()).toBe("features/all()");
    expect(toTest.all(() => {}).toString()).toBe("features/all()");
    expect(toTest.all(() => new QFilterExpression()).toString()).toBe("features/all()");
  });

  test("multiple all filter", () => {
    const result = toTest.all((qTest) => qTest.it.eq(FeatureEnum.Feature2).and(qTest.it.eq(FeatureEnum.Feature3)));
    expect(result.toString()).toBe("features/all(a:a eq 'Feature2' and a eq 'Feature3')");
  });

  test("all with prefix", () => {
    const result = toTest.all((qTest) => qTest.it.eq(FeatureEnum.Feature1), "testing").toString();
    expect(result).toBe("features/all(testing:testing eq 'Feature1')");
  });
});
