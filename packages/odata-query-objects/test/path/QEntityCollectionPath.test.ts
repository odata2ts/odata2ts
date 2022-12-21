import { QEntityCollectionPath, QFilterExpression } from "../../src";
import { QSimpleEntity } from "../fixture/SimpleComplexModel";

describe("QEntityCollectionPath test", () => {
  const createToTest = () => {
    return new QEntityCollectionPath("test", () => QSimpleEntity);
  };

  test("smoke test", () => {
    const result = new QEntityCollectionPath("test", () => QSimpleEntity);
    expect(result.getPath()).toBe("test");
    expect(JSON.stringify(result.getEntity())).toEqual(JSON.stringify(new QSimpleEntity()));
    expect(JSON.stringify(result.getEntity(true))).toEqual(JSON.stringify(new QSimpleEntity("test")));
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QEntityCollectionPath(null, () => QSimpleEntity)).toThrow();
    // @ts-expect-error
    expect(() => new QEntityCollectionPath(undefined, () => QSimpleEntity)).toThrow();
    // @ts-expect-error
    expect(() => new QEntityCollectionPath(undefined, () => QSimpleEntity)).toThrow();
    expect(() => new QEntityCollectionPath("", () => QSimpleEntity)).toThrow();
    expect(() => new QEntityCollectionPath(" ", () => QSimpleEntity)).toThrow();
  });

  test("fails without qObject", () => {
    // @ts-expect-error
    expect(() => new QEntityCollectionPath("test", null)).toThrow();
    // @ts-expect-error
    expect(() => new QEntityCollectionPath("test")).toThrow();
    // @ts-expect-error
    expect(() => new QEntityCollectionPath("test", "")).toThrow();
  });

  test("any filter", () => {
    const result = createToTest()
      .any((qTest) => qTest.id.gt(18))
      .toString();
    expect(result).toBe("test/any(a:a/id gt 18)");
  });

  test("empty any filter", () => {
    const result = createToTest()
      .any(() => new QFilterExpression())
      .toString();
    expect(result).toBe("");
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
    const result = createToTest()
      .all(() => new QFilterExpression())
      .toString();
    expect(result).toBe("");
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
});
