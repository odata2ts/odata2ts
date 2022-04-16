import { QEntityPath } from "../../src";
import { QSimpleEntity } from "../fixture/SimpleComplexModel";

describe("QEntityPath test", () => {
  test("smoke test", () => {
    const result = new QEntityPath("test", () => QSimpleEntity);
    expect(result.getPath()).toBe("test");
    expect(JSON.stringify(result.getEntity())).toEqual(JSON.stringify(new QSimpleEntity()));
    expect(JSON.stringify(result.getEntity(true))).toEqual(JSON.stringify(new QSimpleEntity("test")));
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QEntityPath(null, () => QSimpleEntity)).toThrow();
    // @ts-expect-error
    expect(() => new QEntityPath(undefined, () => QSimpleEntity)).toThrow();
    // @ts-expect-error
    expect(() => new QEntityPath(undefined, () => QSimpleEntity)).toThrow();
    expect(() => new QEntityPath("", () => QSimpleEntity)).toThrow();
    expect(() => new QEntityPath(" ", () => QSimpleEntity)).toThrow();
  });

  test("fails without qObject", () => {
    // @ts-expect-error
    expect(() => new QEntityPath("test", null)).toThrow();
    // @ts-expect-error
    expect(() => new QEntityPath("test")).toThrow();
    // @ts-expect-error
    expect(() => new QEntityPath("test", "")).toThrow();
  });

  test("use entityProps", () => {
    const test = new QEntityPath("test", () => QSimpleEntity);

    expect(test.props.id.gt(1).toString()).toBe("test/id gt 1");
    expect(test.props.name.contains("hi").toString()).toBe("contains(test/name,'hi')");
    expect(test.props.name.asc().toString()).toBe("test/name asc");

    expect(test.getEntity().id.eq(1).toString()).toBe("id eq 1");
    expect(test.getEntity(true).id.eq(1).toString()).toBe("test/id eq 1");
  });
});
