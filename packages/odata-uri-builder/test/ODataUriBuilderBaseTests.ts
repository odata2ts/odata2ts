import { QueryObject } from "@odata2ts/odata-query-objects";
import { QFilterExpression } from "../src/";
import {
  ODataUriBuilderModel,
  ODataUriBuilderConfig,
  ODataUriBuilderV2Model,
  ODataUriBuilderV4Model,
} from "../src/internal";
import { QPerson, qPerson } from "./fixture/types/QSimplePersonModel";

/**
 * Helper function which adds the base path.
 *
 * @param urlPart
 * @returns
 */
function addBase(urlPart: string) {
  return `/Persons?${urlPart}`;
}

export type BuilderFactoryFunction<Q extends QueryObject> = (
  path: string,
  qEntity: Q,
  config?: ODataUriBuilderConfig
) => ODataUriBuilderV2Model<QPerson>;

export function createBaseTests(createBuilder: BuilderFactoryFunction<QPerson>) {
  let toTest: Omit<ODataUriBuilderV2Model<QPerson>, "expanding">;

  /**
   * Always use a new builder for each test.
   */
  beforeEach(() => {
    toTest = createBuilder("/Persons", qPerson, { unencoded: true });
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

  test("select: ignore null or undefined", () => {
    const candidate = toTest.select(null, "name", undefined, "age").build();
    const expected = addBase("$select=name,age");

    expect(candidate).toBe(expected);
  });

  test("select: no param if only null is passed", () => {
    const candidate = toTest.select(null).build();

    expect(candidate).toBe("/Persons");
  });

  test("skip", () => {
    const candidate = toTest.skip(5).build();
    const expected = addBase("$skip=5");

    expect(candidate).toBe(expected);
  });

  test("skip: with zero", () => {
    const candidate = toTest.skip(0).build();
    const expected = addBase("$skip=0");

    expect(candidate).toBe(expected);
  });

  test("skip: fail with negative number", () => {
    expect(() => toTest.skip(-2)).toThrow();
  });

  test("top", () => {
    const candidate = toTest.top(15).build();
    const expected = addBase("$top=15");

    expect(candidate).toBe(expected);
  });

  test("top: with zero", () => {
    const candidate = toTest.top(0).build();
    const expected = addBase("$top=0");

    expect(candidate).toBe(expected);
  });

  test("top: fail with negative number", () => {
    expect(() => toTest.top(-1)).toThrow();
  });

  test("orderBy", () => {
    const candidate = toTest.orderBy(qPerson.name.asc()).build();
    const expected = addBase("$orderby=name asc");

    expect(candidate).toBe(expected);
  });

  test("orderBy: desc", () => {
    const candidate = toTest.orderBy(qPerson.name.desc()).build();
    const expected = addBase("$orderby=name desc");

    expect(candidate).toBe(expected);
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

  /*
  test("filterOr: simple", () => {
    const candidate = toTest.filterOr(qPerson.name.eq("Heinz")).build();
    const expected = addBase("$filter=name eq 'Heinz'");

    expect(candidate).toBe(expected);
  });

  test("filterOr: 2 filters", () => {
    const candidate = toTest.filterOr(qPerson.name.eq("Heinz"), qPerson.age.ge(12)).build();
    const expected = addBase("$filter=name eq 'Heinz' or age ge 12");

    expect(candidate).toBe(expected);
  });

  test("filterOr: multiple times", () => {
    const candidate = toTest
      .filterOr(qPerson.name.eq("Heinz"), qPerson.age.ge(12))
      .filterOr(QPerson.deceased.isTrue(), QPerson.age.gt(50))
      .build();
    const expected = addBase("$filter=(name eq 'Heinz' or age ge 8) and (deceased eq true or age gt 50)");

    expect(candidate).toBe(expected);
  });
  */

  test("expand: simple", () => {
    const candidate = toTest.expand("address").build();
    const expected = addBase("$expand=Address");

    expect(candidate).toBe(expected);
  });

  test("expand: two simple ones", () => {
    const candidate = toTest.expand("address", "altAdresses").build();
    const expected = addBase("$expand=Address,AltAdresses");

    expect(candidate).toBe(expected);
  });
}
