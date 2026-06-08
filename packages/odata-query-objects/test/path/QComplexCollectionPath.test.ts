import { describe, expect, test } from "vitest";
import { QComplexCollectionPath, QFilterExpression } from "../../src";
import { QSimpleEntity } from "../fixture/SimpleComplexModel";

describe("QComplexCollectionPath test", () => {
  const createToTest = () => {
    return new QComplexCollectionPath("test", () => QSimpleEntity);
  };

  test("smoke test", () => {
    const result = new QComplexCollectionPath("test", () => QSimpleEntity);
    expect(result.getPath()).toBe("test");
    expect(JSON.stringify(result.getEntity())).toEqual(JSON.stringify(new QSimpleEntity()));
    expect(JSON.stringify(result.getEntity(true))).toEqual(JSON.stringify(new QSimpleEntity("test")));
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QComplexCollectionPath(null, () => QSimpleEntity)).toThrow();
    // @ts-expect-error
    expect(() => new QComplexCollectionPath(undefined, () => QSimpleEntity)).toThrow();
    // @ts-expect-error
    expect(() => new QComplexCollectionPath(undefined, () => QSimpleEntity)).toThrow();
    expect(() => new QComplexCollectionPath("", () => QSimpleEntity)).toThrow();
    expect(() => new QComplexCollectionPath(" ", () => QSimpleEntity)).toThrow();
  });

  test("fails without qObject", () => {
    // @ts-expect-error
    expect(() => new QComplexCollectionPath("test", null)).toThrow();
    // @ts-expect-error
    expect(() => new QComplexCollectionPath("test")).toThrow();
    // @ts-expect-error
    expect(() => new QComplexCollectionPath("test", "")).toThrow();
  });

  test("any filter", () => {
    const result = createToTest()
      .any((qTest) => qTest.id.gt(18))
      .toString();
    expect(result).toBe("test/any(a:a/id gt 18)");
  });

  test("empty any filter", () => {
    expect(createToTest().any().toString()).toBe("test/any()");
    expect(
      createToTest()
        .any(() => {})
        .toString(),
    ).toBe("test/any()");
    expect(
      createToTest()
        .any(() => new QFilterExpression())
        .toString(),
    ).toBe("test/any()");
  });

  test("complex any filter", () => {
    const checkForAge = true;
    const checkForName = false;

    const result = createToTest().any((qTest) => {
      return new QFilterExpression()
        .and(checkForAge ? qTest.id.gt(18) : null)
        .and(checkForName ? qTest.name.contains("Humunkulus") : null);
    });
    expect(result.toString()).toBe("test/any(a:a/id gt 18)");
  });

  test("multiple any filter", () => {
    const result = createToTest().any((qTest) => qTest.id.gt(18).and(qTest.name.contains("Humu")));
    expect(result.toString()).toBe("test/any(a:a/id gt 18 and contains(a/name,'Humu'))");
  });

  test("any with prefix", () => {
    const result = createToTest()
      .any((qTest) => qTest.id.gt(18), "testing")
      .toString();
    expect(result).toBe("test/any(testing:testing/id gt 18)");
  });

  test("all filter", () => {
    const result = createToTest()
      .all((qTest) => qTest.id.gt(18))
      .toString();
    expect(result).toBe("test/all(a:a/id gt 18)");
  });

  test("empty all filter", () => {
    expect(createToTest().all().toString()).toBe("test/all()");
    expect(
      createToTest()
        .all(() => {})
        .toString(),
    ).toBe("test/all()");
    expect(
      createToTest()
        .all(() => new QFilterExpression())
        .toString(),
    ).toBe("test/all()");
  });

  test("complex all filter", () => {
    const checkForAge = true;
    const checkForName = false;

    const result = createToTest().all((qTest) => {
      return new QFilterExpression()
        .and(checkForAge ? qTest.id.gt(18) : null)
        .and(checkForName ? qTest.name.contains("Humunkulus") : null);
    });
    expect(result.toString()).toBe("test/all(a:a/id gt 18)");
  });

  test("multiple all filter", () => {
    const result = createToTest().all((qTest) => qTest.id.gt(18).and(qTest.name.contains("Humu")));
    expect(result.toString()).toBe("test/all(a:a/id gt 18 and contains(a/name,'Humu'))");
  });

  test("all with prefix", () => {
    const result = createToTest()
      .all((qTest) => qTest.id.gt(18), "testing")
      .toString();
    expect(result).toBe("test/all(testing:testing/id gt 18)");
  });

  test("count ascending and descending", () => {
    expect(createToTest().countAsc().toString()).toBe("test/$count asc");
    expect(createToTest().countDesc().toString()).toBe("test/$count desc");
  });
});
