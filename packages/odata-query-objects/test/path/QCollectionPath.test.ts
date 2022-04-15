import { QCollectionPath, QFilterExpression, QStringCollection } from "../../src";

export interface SampleEntity {}

describe("QCollectionPath test", () => {
  const createToTest = () => {
    return new QCollectionPath("test", () => QStringCollection);
  };

  test("smoke test", () => {
    const result = createToTest();
    expect(result.getPath()).toBe("test");
    expect(result.getEntity()).toStrictEqual(new QStringCollection());
    expect(result.getEntity(true)).toStrictEqual(new QStringCollection("test"));
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QCollectionPath(null, () => QStringCollection)).toThrow();
    // @ts-expect-error
    expect(() => new QCollectionPath(undefined, () => QStringCollection)).toThrow();
    // @ts-expect-error
    expect(() => new QCollectionPath(undefined, () => QStringCollection)).toThrow();
    expect(() => new QCollectionPath("", () => QStringCollection)).toThrow();
    expect(() => new QCollectionPath(" ", () => QStringCollection)).toThrow();
  });

  test("fails without qObject", () => {
    // @ts-expect-error
    expect(() => new QCollectionPath("test", null)).toThrow();
    // @ts-expect-error
    expect(() => new QCollectionPath("test")).toThrow();
    // @ts-expect-error
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
      .any(() => new QFilterExpression())
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
      .all(() => new QFilterExpression())
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
