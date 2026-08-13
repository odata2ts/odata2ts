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

  // Note: BaseEnumParam.parseUrlValue()'s JSON-array fallback branch (`if (value && parsed === undefined)`)
  // is structurally unreachable - parseWithQuotes() throws for any truthy, non-"null", unquoted string before
  // that check is reached, and parseNullValue() only ever produces `undefined` when `value` itself is falsy
  // (making the `value &&` half of the condition false). Not tested here.
});

/**
 * The counterpart of the converter-carrying `QEnumPath`: an enum derived from `Validation.AllowedValues`,
 * whose members are names the service never sees.
 */
describe("QEnumParam with a converter Tests", () => {
  enum Status {
    Available = "Available",
    OnLoan = "OnLoan",
    Missing = "Missing",
  }

  const values: Record<Status, number> = { [Status.Available]: 0, [Status.OnLoan]: 1, [Status.Missing]: 2 };
  const members: Record<number, Status> = { 0: Status.Available, 1: Status.OnLoan, 2: Status.Missing };

  const converter = {
    id: "StatusConverter",
    from: "Edm.Byte",
    to: "Status",
    convertFrom(value: number | null | undefined): Status | null | undefined {
      return value === null || value === undefined ? value : members[value];
    },
    convertTo(value: Status | null | undefined): number | null | undefined {
      return value === null || value === undefined ? value : values[value];
    },
  };

  const toTest = new QEnumParam<typeof Status, number>("Status", undefined, converter);

  test("converts to and from the value the service transmits", () => {
    expect(toTest.convertTo(Status.OnLoan)).toBe(1);
    expect(toTest.convertFrom(2)).toBe(Status.Missing);
    expect(toTest.convertFrom([0, null, 2])).toStrictEqual([Status.Available, null, Status.Missing]);
  });

  test("the URL carries the value unquoted", () => {
    expect(toTest.formatUrlValue(Status.Available)).toBe("0");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBeUndefined();
  });

  test("and is read back from it", () => {
    expect(toTest.parseUrlValue("1")).toBe(Status.OnLoan);
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBeUndefined();
  });
});
