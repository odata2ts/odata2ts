import { describe, expect, test } from "vitest";
import { QDateTimeOffsetPath, QGuidPath, QNumberPath, QStringPath } from "../../src";

describe("filter clauses", () => {
  const id = new QNumberPath("MediumId");
  const title = new QStringPath("Title");

  test("every comparison operator records one clause with the typed value", () => {
    expect(id.eq(5).getClauses()).toEqual([{ path: "MediumId", operator: "eq", value: 5 }]);
    expect(id.ne(5).getClauses()).toEqual([{ path: "MediumId", operator: "ne", value: 5 }]);
    expect(id.lt(5).getClauses()).toEqual([{ path: "MediumId", operator: "lt", value: 5 }]);
    expect(id.le(5).getClauses()).toEqual([{ path: "MediumId", operator: "le", value: 5 }]);
    expect(id.gt(5).getClauses()).toEqual([{ path: "MediumId", operator: "gt", value: 5 }]);
    expect(id.ge(5).getClauses()).toEqual([{ path: "MediumId", operator: "ge", value: 5 }]);
  });

  test("a string value is the bare string, not the quoted URL literal", () => {
    expect(title.eq("ai").getClauses()).toEqual([{ path: "Title", operator: "eq", value: "ai" }]);
    expect(title.eq("ai").toString()).toBe("Title eq 'ai'");
  });

  test("isNull and isNotNull record a clause with value null", () => {
    expect(title.isNull().getClauses()).toEqual([{ path: "Title", operator: "eq", value: null }]);
    expect(title.isNotNull().getClauses()).toEqual([{ path: "Title", operator: "ne", value: null }]);
  });

  test("an explicit null value records a clause", () => {
    expect(title.eq(null).getClauses()).toEqual([{ path: "Title", operator: "eq", value: null }]);
  });

  test("a value converter is applied: the clause holds the OData-side value", () => {
    const converter = {
      id: "test",
      from: "Edm.String",
      to: "number",
      convertFrom: (v: string | null | undefined) => (v == null ? v : Number(v)),
      convertTo: (v: number | null | undefined) => (v == null ? v : String(v)),
    };
    const converted = new QNumberPath("Big", converter as any);
    expect(converted.eq(9 as any).getClauses()).toEqual([{ path: "Big", operator: "eq", value: "9" }]);
  });

  test("a property-to-property comparison is raw, with no clause", () => {
    const other = new QStringPath("Subtitle");
    const expression = title.eq(other);
    expect(expression.getClauses()).toEqual([]);
    expect(expression.getRaw()).toEqual(["Title eq Subtitle"]);
  });

  test("string functions are raw only", () => {
    const expression = title.contains("ai");
    expect(expression.getClauses()).toEqual([]);
    expect(expression.getRaw()).toEqual(["contains(Title,'ai')"]);
  });

  test("the emulated in operator is raw only", () => {
    const expression = id.in(1, 2);
    expect(expression.getClauses()).toEqual([]);
    expect(expression.getRaw()).toEqual(["(MediumId eq 1 or MediumId eq 2)"]);
  });

  test("the native in operator is raw only", () => {
    const nativeIn = new QNumberPath("MediumId", undefined, { nativeIn: true });
    const expression = nativeIn.in(1, 2);
    expect(expression.getClauses()).toEqual([]);
    expect(expression.getRaw()).toEqual(["MediumId in (1,2)"]);
  });

  test("a guid keeps its bare string form", () => {
    const guid = new QGuidPath("Id");
    expect(guid.eq("5f2c").getClauses()).toEqual([{ path: "Id", operator: "eq", value: "5f2c" }]);
  });

  test("a date offset keeps its ISO string, not a V2 type prefix", () => {
    const at = new QDateTimeOffsetPath("LoanedAt");
    expect(at.eq("2026-01-01T00:00:00Z").getClauses()).toEqual([
      { path: "LoanedAt", operator: "eq", value: "2026-01-01T00:00:00Z" },
    ]);
  });
});
