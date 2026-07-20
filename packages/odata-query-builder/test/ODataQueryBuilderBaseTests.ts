import { QFilterExpression, QSelectExpression, QueryObject } from "@odata2ts/odata-query-objects";
import { beforeEach, expect, test } from "vitest";
import { CollectionQueryBuilderV2, CollectionQueryBuilderV4, ODataQueryBuilderConfig } from "../src";
import { QPerson, qPerson } from "./fixture/types/QSimplePersonModel";

/**
 * Helper function which adds the base path.
 *
 * @param urlPart
 * @returns
 */
function addBase(urlPart: string) {
  return `/Persons${urlPart ? `?${urlPart}` : ""}`;
}

type QueryBuilder =
  | Omit<CollectionQueryBuilderV2<QPerson>, "expanding" | "count" | "expand">
  | Omit<CollectionQueryBuilderV4<QPerson>, "expanding" | "count" | "groupBy" | "expand">;

export type BuilderFactoryFunction<Q extends QueryObject> = (
  path: string,
  qEntity: Q,
  config?: ODataQueryBuilderConfig,
) => QueryBuilder;

export function createBaseTests(createBuilder: BuilderFactoryFunction<QPerson>) {
  let toTest: QueryBuilder;

  function refresh() {
    toTest = createBuilder("/Persons", qPerson, { unencoded: true });
  }

  /**
   * Always use a new builder for each test.
   */
  beforeEach(() => {
    refresh();
  });

  test("create: minimal default", () => {
    expect(toTest.build()).toBe("/Persons");
  });

  test("create: fail with missing QObject", () => {
    // @ts-expect-error
    expect(() => createBuilder(null)).toThrow();
    // @ts-expect-error
    expect(() => createBuilder()).toThrow();
    // @ts-expect-error
    expect(() => createBuilder({})).toThrow();
  });

  test("config: encoded", () => {
    const candidate = createBuilder("/Persons", qPerson)
      .select("name", "age")
      .filter(qPerson.name.equals("AC/DC & Brothers"))
      .build();
    const expected = addBase("%24select=name%2Cage&%24filter=name%20eq%20'AC%2FDC%20%26%20Brothers'");

    expect(candidate).toBe(expected);
  });

  test("select: 2 props", () => {
    const candidate = toTest.select("name", "age").build();
    const expected = addBase("$select=name,age");

    expect(candidate).toBe(expected);
  });

  test("select: multiple times", () => {
    const candidate = toTest.select("name").select("age").build();
    const expected = addBase("$select=name,age");

    expect(candidate).toBe(expected);
  });

  test("select: ignore nullables", () => {
    const candidate = toTest.select(null, "name", undefined, "age").build();
    const expected = addBase("$select=name,age");

    expect(candidate).toBe(expected);
  });

  test("select: no param if only nullable is passed", () => {
    const candidate = toTest.select(null).build();

    expect(candidate).toBe("/Persons");
    expect(toTest.select().build()).toBe("/Persons");
  });

  test("select: custom props", () => {
    const candidate = toTest.select("name", new QSelectExpression("Test")).build();
    const expected = addBase("$select=name,Test");

    expect(candidate).toBe(expected);
  });

  test("select: wildcard", () => {
    const candidate = toTest.select("*").build();

    expect(candidate).toBe(addBase("$select=*"));
  });

  test("select: wildcard combined with named prop in one call", () => {
    const candidate = toTest.select("*", "name").build();

    expect(candidate).toBe(addBase("$select=*,name"));
  });

  test("select: wildcard combined with named prop across chained calls", () => {
    const candidate = toTest.select("*").select("name").build();

    expect(candidate).toBe(addBase("$select=*,name"));
  });

  test("skip", () => {
    expect(toTest.skip(99).build()).toBe(addBase("$skip=99"));
    refresh();
    expect(toTest.skip(0).build()).toBe(addBase("$skip=0"));
    refresh();
    expect(toTest.skip(-5).build()).toBe(addBase("$skip=-5"));
  });

  test("skip: ignore nullable", () => {
    expect(toTest.skip(null).build()).toBe(addBase(""));
    expect(toTest.skip(undefined).build()).toBe(addBase(""));
  });

  test("top", () => {
    expect(toTest.top(15).build()).toBe(addBase("$top=15"));
    refresh();
    expect(toTest.top(0).build()).toBe(addBase("$top=0"));
    refresh();
    expect(toTest.top(-3).build()).toBe(addBase("$top=-3"));
  });

  test("top: ignore nullable", () => {
    expect(toTest.top(null).build()).toBe(addBase(""));
    expect(toTest.top(undefined).build()).toBe(addBase(""));
  });

  test("orderBy", () => {
    const expectedAsc = addBase("$orderby=name asc");
    const expectedDesc = addBase("$orderby=name desc");

    expect(toTest.orderBy(qPerson.name.asc()).build()).toBe(expectedAsc);
    refresh();
    expect(toTest.orderBy(qPerson.name.ascending()).build()).toBe(expectedAsc);
    refresh();
    expect(toTest.orderBy(qPerson.name.desc()).build()).toBe(expectedDesc);
    refresh();
    expect(toTest.orderBy(qPerson.name.descending()).build()).toBe(expectedDesc);
  });

  test("orderBy: multiple", () => {
    const candidate = toTest.orderBy(qPerson.name.descending(), qPerson.age.ascending()).build();
    const expected = addBase("$orderby=name desc,age asc");

    expect(candidate).toBe(expected);
  });

  test("orderBy: consecutive", () => {
    const candidate = toTest.orderBy(qPerson.name.descending()).orderBy(qPerson.age.ascending()).build();
    const expected = addBase("$orderby=name desc,age asc");

    expect(candidate).toBe(expected);
  });

  test("orderBy: ignore nullable", () => {
    expect(toTest.orderBy(null).build()).toBe(addBase(""));
    refresh();
    expect(toTest.orderBy(undefined).build()).toBe(addBase(""));
    refresh();
    expect(toTest.orderBy(undefined, qPerson.name.descending()).build()).toBe(addBase("$orderby=name desc"));
  });

  test("filter: simple", () => {
    const candidate = toTest.filter(qPerson.name.eq("Heinz")).build();
    const expected = addBase("$filter=name eq 'Heinz'");

    expect(candidate).toBe(expected);
  });

  test("filter: 2 filters", () => {
    const candidate = toTest.filter(qPerson.name.eq("Heinz"), qPerson.age.eq(8)).build();
    const expected = addBase("$filter=name eq 'Heinz' and age eq 8");

    expect(candidate).toBe(expected);
  });

  test("filter: multiple times", () => {
    const candidate = toTest.filter(qPerson.name.eq("Heinz")).filter(qPerson.age.eq(8)).build();
    const expected = addBase("$filter=name eq 'Heinz' and age eq 8");

    expect(candidate).toBe(expected);
  });

  test("filter: add expression manually", () => {
    const candidate = toTest
      .filter(new QFilterExpression("name eq 'Heinz'").and(new QFilterExpression("age eq 8")))
      .build();
    const expected = addBase("$filter=name eq 'Heinz' and age eq 8");

    expect(candidate).toBe(expected);
  });

  test("filter: don't filter if all filters are empty", () => {
    const candidate = toTest.filter(new QFilterExpression()).build();

    expect(candidate).toBe("/Persons");
  });

  test("filter: don't apply empty filters", () => {
    const candidate = toTest.filter(new QFilterExpression("name eq 'Heinz'").and(new QFilterExpression())).build();
    const expected = addBase("$filter=name eq 'Heinz'");

    expect(candidate).toBe(expected);
  });

  test("filter: ignore nullables", () => {
    const expectedNull = addBase("");

    expect(toTest.filter(null).build()).toBe(expectedNull);
    refresh();
    expect(toTest.filter(undefined).build()).toBe(expectedNull);
    refresh();
    expect(toTest.filter(undefined, qPerson.name.eq("Heinz"), null).build()).toBe(addBase("$filter=name eq 'Heinz'"));
  });

  test("filter use raw expression", () => {
    const raw = "name eq 'Heinz'";
    const candidate = toTest.filter(new QFilterExpression(raw)).build();
    const expected = addBase(`$filter=${raw}`);

    expect(candidate).toBe(expected);
  });

  test("clone", () => {
    const expected = JSON.stringify(toTest);

    // clone is identical
    let result = toTest.clone();
    expect(JSON.stringify(result)).toStrictEqual(expected);

    // changing the clone won't change original
    result.select("createdAt");
    expect(JSON.stringify(result)).not.toStrictEqual(expected);
    expect(JSON.stringify(toTest)).toBe(expected);
  });
}
