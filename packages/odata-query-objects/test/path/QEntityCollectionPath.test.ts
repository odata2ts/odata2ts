import { QEntityFactory, QEntityCollectionPath, QStringPath, QNumberPath, QFilterExpression } from "../../src";

export interface SampleEntity {
  name: string;
  age: number;
}

describe("QEntityCollectionPath test", () => {
  const qEntity = QEntityFactory.create<SampleEntity>({
    name: QStringPath,
    age: QNumberPath,
  });

  const createToTest = () => {
    return new QEntityCollectionPath("test", () => qEntity);
  };

  test("smoke test", () => {
    const result = new QEntityCollectionPath("test", () => qEntity);
    expect(result.getPath()).toBe("test");
    expect(result.withPath("new").getPath()).toBe("new");
    expect(result.getEntity()).toBe(qEntity);
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-ignore
    expect(() => new QEntityCollectionPath(null, () => qEntity)).toThrow();
    // @ts-ignore
    expect(() => new QEntityCollectionPath(undefined, () => qEntity)).toThrow();
    // @ts-ignore
    expect(() => new QEntityCollectionPath(undefined, () => qEntity)).toThrow();
    expect(() => new QEntityCollectionPath("", () => qEntity)).toThrow();
    expect(() => new QEntityCollectionPath(" ", () => qEntity)).toThrow();
  });

  test("fails without qObject", () => {
    // @ts-ignore
    expect(() => new QEntityCollectionPath("test", null)).toThrow();
    // @ts-ignore
    expect(() => new QEntityCollectionPath("test")).toThrow();
    // @ts-ignore
    expect(() => new QEntityCollectionPath("test", "")).toThrow();
  });

  test("any filter", () => {
    const result = createToTest()
      .any((qTest) => qTest.age.gt(18))
      .toString();
    expect(result).toBe("test/any(a:a/age gt 18)");
  });

  test("empty any filter", () => {
    const result = createToTest()
      .any((qTest) => new QFilterExpression())
      .toString();
    expect(result).toBe("");
  });

  test("complex any filter", () => {
    const checkForAge = true;
    const checkForName = false;

    const result = createToTest().any((qTest) => {
      const filter = new QFilterExpression();
      if (checkForAge) {
        filter.and(qTest.age.gt(18));
      }
      if (checkForName) {
        filter.and(qTest.name.contains("Humunkulus"));
      }
      return filter;
    });
    expect(result.toString()).toBe("test/any(a:a/age gt 18)");
  });

  test("multiple any filter", () => {
    const result = createToTest().any((qTest) => qTest.age.gt(18).and(qTest.name.contains("Humu")));
    expect(result.toString()).toBe("test/any(a:a/age gt 18 and contains(a/name,'Humu'))");
  });

  test("any with prefix", () => {
    const result = createToTest()
      .any((qTest) => qTest.age.gt(18), "testing")
      .toString();
    expect(result).toBe("test/any(testing:testing/age gt 18)");
  });

  test("all filter", () => {
    const result = createToTest()
      .all((qTest) => qTest.age.gt(18))
      .toString();
    expect(result).toBe("test/all(a:a/age gt 18)");
  });

  test("empty all filter", () => {
    const result = createToTest()
      .all((qTest) => new QFilterExpression())
      .toString();
    expect(result).toBe("");
  });

  test("complex all filter", () => {
    const checkForAge = true;
    const checkForName = false;

    const result = createToTest().all((qTest) => {
      const filter = new QFilterExpression();
      if (checkForAge) {
        filter.and(qTest.age.gt(18));
      }
      if (checkForName) {
        filter.and(qTest.name.contains("Humunkulus"));
      }
      return filter;
    });
    expect(result.toString()).toBe("test/all(a:a/age gt 18)");
  });

  test("multiple all filter", () => {
    const result = createToTest().all((qTest) => qTest.age.gt(18).and(qTest.name.contains("Humu")));
    expect(result.toString()).toBe("test/all(a:a/age gt 18 and contains(a/name,'Humu'))");
  });

  test("all with prefix", () => {
    const result = createToTest()
      .all((qTest) => qTest.age.gt(18), "testing")
      .toString();
    expect(result).toBe("test/all(testing:testing/age gt 18)");
  });
});
