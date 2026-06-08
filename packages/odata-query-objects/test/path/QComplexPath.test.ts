import { describe, expect, test } from "vitest";
import { QComplexPath } from "../../src";
import { QComplexType, QSimpleEntity } from "../fixture/SimpleComplexModel";

describe("QComplexPath test", () => {
  test("smoke test", () => {
    const result = new QComplexPath("test", () => QComplexType);
    expect(result.getPath()).toBe("test");
    expect(JSON.stringify(result.getEntity())).toEqual(JSON.stringify(new QComplexType()));
    expect(JSON.stringify(result.getEntity(true))).toEqual(JSON.stringify(new QComplexType("test")));
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QComplexPath(null, () => QComplexType)).toThrow();
    // @ts-expect-error
    expect(() => new QComplexPath(undefined, () => QComplexType)).toThrow();
    // @ts-expect-error
    expect(() => new QComplexPath(undefined, () => QComplexType)).toThrow();
    expect(() => new QComplexPath("", () => QComplexType)).toThrow();
    expect(() => new QComplexPath(" ", () => QComplexType)).toThrow();
  });

  test("fails without qObject", () => {
    // @ts-expect-error
    expect(() => new QComplexPath("test", null)).toThrow();
    // @ts-expect-error
    expect(() => new QComplexPath("test")).toThrow();
    // @ts-expect-error
    expect(() => new QComplexPath("test", "")).toThrow();
  });

  test("use entityProps", () => {
    const test = new QComplexPath("test", () => QComplexType);

    expect(test.props.test.contains("hi").toString()).toBe("contains(test/test,'hi')");
  });
});
