import { QEntityFactory } from "./../../src/QEntityFactory";
import { QEntityCollectionPath } from "./../../src/path/QEntityCollectionPath";

export interface SampleEntity {}

describe("QEntityCollectionPath test", () => {
  const qEntity = QEntityFactory.create("test", {});

  test("smoke test", () => {
    const result = new QEntityCollectionPath("test", () => qEntity);
    expect(result.getPath()).toBe("test");
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
});
