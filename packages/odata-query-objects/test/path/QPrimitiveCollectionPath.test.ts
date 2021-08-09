import { QStringPath } from "./../../src/path/QStringPath";
import { QEntityFactory, QPrimitiveCollectionPath } from "./../../src";

describe("QPrimitiveCollectionPath test", () => {
  const qEntity = QEntityFactory.create({});

  test("smoke test", () => {
    const result = new QPrimitiveCollectionPath("test", QStringPath);
    expect(result.getPath()).toBe("test");
    expect(result.getQPath().getPath()).toBe("$it");
    expect(result.getQPath().eq("hi").toString()).toBe("$it eq 'hi'");
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-ignore
    expect(() => new QPrimitiveCollectionPath(null, QStringPath)).toThrow();
    // @ts-ignore
    expect(() => new QPrimitiveCollectionPath(undefined, QStringPath)).toThrow();
    // @ts-ignore
    expect(() => new QPrimitiveCollectionPath(undefined, QStringPath)).toThrow();
    expect(() => new QPrimitiveCollectionPath("", QStringPath)).toThrow();
    expect(() => new QPrimitiveCollectionPath(" ", QStringPath)).toThrow();
  });

  test("fails without pathConstructor", () => {
    // @ts-ignore
    expect(() => new QEntityCollectionPath("test", null)).toThrow();
    // @ts-ignore
    expect(() => new QEntityCollectionPath("test")).toThrow();
    // @ts-ignore
    expect(() => new QEntityCollectionPath("test", "")).toThrow();
  });
});
