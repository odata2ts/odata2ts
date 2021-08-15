import { QCollectionPath, qStringCollection } from "../../src";

export interface SampleEntity {}

describe("QCollectionPath test", () => {
  const qEntity = qStringCollection;

  test("smoke test", () => {
    const result = new QCollectionPath("test", () => qEntity);
    expect(result.getPath()).toBe("test");
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
});
