import { QCollectionPath, qStringCollection, QFilterExpression } from "../../src";

export interface SampleEntity {}

describe("QCollectionPath test", () => {
  const qEntity = qStringCollection;

  const createToTest = () => {
    return new QCollectionPath("test", () => qEntity);
  };

  test("smoke test", () => {
    const result = createToTest();
    expect(result.getPath()).toBe("test");
    expect(result.withPath("new").getPath()).toBe("new");
    expect(result.getEntity()).toBe(qEntity);
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-ignore
    expect(() => new QCollectionPath(null, () => qEntity)).toThrow();
    // @ts-ignore
    expect(() => new QCollectionPath(undefined, () => qEntity)).toThrow();
    // @ts-ignore
    expect(() => new QCollectionPath(undefined, () => qEntity)).toThrow();
    expect(() => new QCollectionPath("", () => qEntity)).toThrow();
    expect(() => new QCollectionPath(" ", () => qEntity)).toThrow();
  });

  test("fails without qObject", () => {
    // @ts-ignore
    expect(() => new QCollectionPath("test", null)).toThrow();
    // @ts-ignore
    expect(() => new QCollectionPath("test")).toThrow();
    // @ts-ignore
    expect(() => new QCollectionPath("test", "")).toThrow();
  });

  test("any filter", () => {
    const result = createToTest()
      .any((qTest) => qTest.it.eq("New York"))
      .toString();
    expect(result).toBe("test/any(a:a eq 'New York')");
  });

  test("empty any filter", () => {
    const result = createToTest()
      .any((qTest) => new QFilterExpression())
      .toString();
    expect(result).toBe("");
  });

  test("multiple any filter", () => {
    const result = createToTest().any((qTest) => qTest.it.contains("New").and(qTest.it.contains("York")));
    expect(result.toString()).toBe("test/any(a:contains(a,'New') and contains(a,'York'))");
  });

  test("any with prefix", () => {
    const result = createToTest()
      .any((qTest) => qTest.it.eq("New York"), "testing")
      .toString();
    expect(result).toBe("test/any(testing:testing eq 'New York')");
  });

  test("all filter", () => {
    const result = createToTest()
      .all((qTest) => qTest.it.eq("New York"))
      .toString();
    expect(result).toBe("test/all(a:a eq 'New York')");
  });

  test("empty all filter", () => {
    const result = createToTest()
      .all((qTest) => new QFilterExpression())
      .toString();
    expect(result).toBe("");
  });

  test("multiple all filter", () => {
    const result = createToTest().all((qTest) => qTest.it.contains("New").and(qTest.it.contains("York")));
    expect(result.toString()).toBe("test/all(a:contains(a,'New') and contains(a,'York'))");
  });

  test("all with prefix", () => {
    const result = createToTest()
      .all((qTest) => qTest.it.eq("New York"), "testing")
      .toString();
    expect(result).toBe("test/all(testing:testing eq 'New York')");
  });
});
