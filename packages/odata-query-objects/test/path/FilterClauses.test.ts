import { describe, expect, test } from "vitest";
import {
  QCollectionPath,
  QDateTimeOffsetPath,
  QEnumPath,
  QFlagsEnumPath,
  QGuidPath,
  QNumberPath,
  QNumericEnumPath,
  QNumericFlagsEnumPath,
  QStringCollection,
  QStringPath,
  QStringV2Path,
} from "../../src";

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

  enum FeatureEnum {
    Feature1 = "Feature1",
    Feature2 = "Feature2",
  }
  enum NumericFeatureEnum {
    Feature1,
    Feature2,
  }

  test("a string enum comparison records the bare symbolic name, while toString() still quotes it", () => {
    const feature = new QEnumPath("Feature", FeatureEnum);
    const expression = feature.eq(FeatureEnum.Feature1);
    expect(expression.getClauses()).toEqual([{ path: "Feature", operator: "eq", value: "Feature1" }]);
    expect(expression.toString()).toBe("Feature eq 'Feature1'");
  });

  test("a numeric enum comparison records the symbolic name as a string, not the number", () => {
    const feature = new QNumericEnumPath("Feature", NumericFeatureEnum);
    const expression = feature.eq(NumericFeatureEnum.Feature1);
    expect(expression.getClauses()).toEqual([{ path: "Feature", operator: "eq", value: "Feature1" }]);
  });

  test("a string enum with a wire-value converter records that value as a string", () => {
    const converter = {
      id: "test",
      from: "Edm.Byte",
      to: "FeatureEnum",
      convertFrom: (v: number | null | undefined) => (v == null ? v : FeatureEnum.Feature1),
      convertTo: (v: FeatureEnum | null | undefined) => (v == null ? v : 0),
    };
    const feature = new QEnumPath<typeof FeatureEnum, number>("Feature", FeatureEnum, converter);
    const expression = feature.eq(FeatureEnum.Feature1);
    expect(expression.getClauses()).toEqual([{ path: "Feature", operator: "eq", value: "0" }]);
  });

  test("has() on both flags variants records a clause", () => {
    const stringFlags = new QFlagsEnumPath("Feature", FeatureEnum);
    expect(stringFlags.has(FeatureEnum.Feature2).getClauses()).toEqual([
      { path: "Feature", operator: "has", value: "Feature2" },
    ]);

    const numericFlags = new QNumericFlagsEnumPath("Feature", NumericFeatureEnum);
    expect(numericFlags.has(NumericFeatureEnum.Feature2).getClauses()).toEqual([
      { path: "Feature", operator: "has", value: "Feature2" },
    ]);
  });

  test("in() on an enum path still records nothing", () => {
    const feature = new QEnumPath("Feature", FeatureEnum);
    expect(feature.in(FeatureEnum.Feature1, FeatureEnum.Feature2).getClauses()).toEqual([]);
  });

  test("isNull() on an enum path still records value null", () => {
    const feature = new QEnumPath("Feature", FeatureEnum);
    expect(feature.isNull().getClauses()).toEqual([{ path: "Feature", operator: "eq", value: null }]);
  });
});

describe("expressions that cannot be decomposed", () => {
  test("a lambda operator over a collection is raw only", () => {
    const keywords = new QCollectionPath("Keywords", () => QStringCollection);
    const expression = keywords.any((q) => q.it.eq("ai"));
    expect(expression.getClauses()).toEqual([]);
    expect(expression.getRaw()).toHaveLength(1);
    expect(expression.getRaw()[0]).toBe(expression.toString());
  });

  test("an empty lambda is raw only", () => {
    const keywords = new QCollectionPath("Keywords", () => QStringCollection);
    const expression = keywords.any();
    expect(expression.getClauses()).toEqual([]);
    expect(expression.getRaw()).toEqual(["Keywords/any()"]);
  });

  test("a V2 string function is raw only", () => {
    const title = new QStringV2Path("Title");
    const expression = title.startsWith("a");
    expect(expression.getClauses()).toEqual([]);
    expect(expression.getRaw()).toHaveLength(1);
  });
});
