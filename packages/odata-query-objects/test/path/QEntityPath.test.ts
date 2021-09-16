import { QEntityPath } from "./../../src";
import { QEntityFactory } from "./../../src";

describe("QEntityPath test", () => {
  const qEntity = QEntityFactory.create({});

  test("smoke test", () => {
    const result = new QEntityPath("test", () => qEntity);
    expect(result.getPath()).toBe("test");
    expect(result.withPath("new").getPath()).toBe("new");
    expect(result.getEntity()).toBe(qEntity);
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-ignore
    expect(() => new QEntityPath(null, () => qEntity)).toThrow();
    // @ts-ignore
    expect(() => new QEntityPath(undefined, () => qEntity)).toThrow();
    // @ts-ignore
    expect(() => new QEntityPath(undefined, () => qEntity)).toThrow();
    expect(() => new QEntityPath("", () => qEntity)).toThrow();
    expect(() => new QEntityPath(" ", () => qEntity)).toThrow();
  });

  test("fails without qObject", () => {
    // @ts-ignore
    expect(() => new QEntityPath("test", null)).toThrow();
    // @ts-ignore
    expect(() => new QEntityPath("test")).toThrow();
    // @ts-ignore
    expect(() => new QEntityPath("test", "")).toThrow();
  });
});
