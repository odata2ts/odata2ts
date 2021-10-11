import { QEntityFactory, QEntityPath, QNumberPath, QStringPath } from "./../../src";

interface SimpleEntity {
  id: number;
  name: string;
}

describe("QEntityPath test", () => {
  const qEntity = QEntityFactory.create<SimpleEntity>({ id: QNumberPath, name: QStringPath });

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

  test("use entityProps", () => {
    const test = new QEntityPath("test", () => qEntity);

    expect(test.props.id.gt(1).toString()).toBe("test/id gt 1");
    expect(test.props.name.contains("hi").toString()).toBe("contains(test/name,'hi')");
    expect(test.props.name.asc().toString()).toBe("test/name asc");

    // check that entity hasn't been modified
    expect(test.getEntity().id.eq(1).toString()).toBe("id eq 1");
    expect(test.getEntity().name.eq("test").toString()).toBe("name eq 'test'");
  });
});
