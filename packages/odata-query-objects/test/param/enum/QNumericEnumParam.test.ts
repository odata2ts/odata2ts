import { FIXED_DATE, FIXED_STRING, fixedDateConverter, stringToPrefixModelConverter } from "@odata2ts/test-converters";
import { describe, expect, test } from "vitest";
import { QNumericEnumParam } from "../../../src";

describe("QNumericEnumParam Tests", () => {
  enum TestEnum {
    A,
    B = 10,
    C,
  }

  const NAME = "T3st_bbb";
  const toTest = new QNumericEnumParam<typeof TestEnum>(TestEnum, NAME);

  test("base attributes", () => {
    expect(toTest.getName()).toBe(NAME);
    expect(toTest.getMappedName()).toBe(NAME);
  });

  test("fail creation", () => {
    // @ts-expect-error
    expect(() => new QNumericEnumParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QNumericEnumParam(null)).toThrowError();
    // @ts-expect-error
    expect(() => new QNumericEnumParam(TestEnum)).toThrowError();
    // @ts-expect-error
    expect(() => new QNumericEnumParam(TestEnum, null)).toThrowError();
  });

  test("fail creation: missing enum with a valid name", () => {
    // @ts-expect-error
    expect(() => new QNumericEnumParam(null, NAME)).toThrow("Enum must be supplied!");
    // @ts-expect-error
    expect(() => new QNumericEnumParam(undefined, NAME)).toThrow("Enum must be supplied!");
  });

  test("mapped name", () => {
    const mappedName = "testB";
    const toTest = new QNumericEnumParam(TestEnum, NAME, mappedName);

    expect(toTest.getName()).toBe(NAME);
    expect(toTest.getMappedName()).toBe(mappedName);
  });

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue(TestEnum.A)).toBe("'A'");
    expect(toTest.formatUrlValue(10)).toBe("'B'");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("'C'")).toBe(TestEnum.C);
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);
  });

  // Note: see QEnumParam.test.ts for why BaseEnumParam.parseUrlValue()'s JSON-array fallback branch is
  // structurally unreachable and not tested here.
});
