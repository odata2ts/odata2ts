import { describe, expect, test } from "vitest";
import { QEnumParam } from "../../../src";

describe("QEnumParam Tests", () => {
  enum TestEnum {
    A = "A",
    B = "B",
    ZEBRA = "ZEBRA",
  }

  const NAME = "T3st_bbb";
  const toTest = new QEnumParam<typeof TestEnum>(NAME);

  test("base attributes", () => {
    expect(toTest.getName()).toBe(NAME);
    expect(toTest.getMappedName()).toBe(NAME);
  });

  test("fail creation", () => {
    // @ts-expect-error
    expect(() => new QEnumParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QEnumParam(null)).toThrowError();
  });

  test("mapped name", () => {
    const mappedName = "TestB";
    const toTest = new QEnumParam(NAME, mappedName);

    expect(toTest.getName()).toBe(NAME);
    expect(toTest.getMappedName()).toBe(mappedName);
  });

  test("convertFrom", () => {
    expect(toTest.convertFrom("B")).toBe(TestEnum.B);
    expect(toTest.convertFrom(["B", null, "ZEBRA"])).toStrictEqual([TestEnum.B, null, TestEnum.ZEBRA]);
    expect(toTest.convertFrom(null)).toBe(null);
    expect(toTest.convertFrom(undefined)).toBeUndefined();
  });

  test("convertTo", () => {
    expect(toTest.convertTo(TestEnum.ZEBRA)).toBe("ZEBRA");
    expect(toTest.convertTo("ZEBRA")).toBe("ZEBRA");
    expect(toTest.convertTo([TestEnum.ZEBRA, "B", undefined])).toStrictEqual(["ZEBRA", "B", undefined]);
    expect(toTest.convertTo(null)).toBe(null);
    expect(toTest.convertTo(undefined)).toBeUndefined;
  });

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue(TestEnum.B)).toBe("'B'");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("'ZEBRA'")).toBe(TestEnum.ZEBRA);
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);
  });
});
