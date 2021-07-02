import { QExpression } from "@odata2ts/odata-query-objects";
import { ODataUriBuilder } from "../src/ODataUriBuilder";
import { Person, QPerson } from "./types/custom";

/**
 * Helper function which adds the base path.
 *
 * @param urlPart
 * @returns
 */
function addBase(urlPart: string) {
  return `/Persons?${urlPart}`;
}

describe("ODataUriBuilder Test", () => {
  let toTest: ODataUriBuilder<Person, "name" | "age">;

  /**
   * Always use a new builder for each  test.
   */
  beforeEach(() => {
    toTest = ODataUriBuilder.create(QPerson, { unencoded: true });
  });

  test("create: minimal default", () => {
    expect(toTest.build()).toBe("/Persons");
  });

  test("create: fail with missing QObject", () => {
    // @ts-ignore
    expect(() => ODataUriBuilder.create(null)).toThrow();
    // @ts-expect-error
    expect(() => ODataUriBuilder.create()).toThrow();
    // @ts-expect-error
    expect(() => ODataUriBuilder.create({})).toThrow();
    expect(() => ODataUriBuilder.create({ __collectionPath: " " })).toThrow();
  });

  test("config: encoded", () => {
    const candidate = ODataUriBuilder.create(QPerson)
      .select("name", "age")
      .filter(QPerson.name.equals("AC/DC & Brothers"))
      .build();
    const expected = addBase("%24select=name%2Cage&%24filter=name%20eq%20'AC%2FDC%20%26%20Brothers'");

    expect(candidate).toBe(expected);
  });

  test("config: encoded & no double encoding for expanded entities", () => {
    const candidate = ODataUriBuilder.create(QPerson)
      .select("name", "age")
      .expanding("altAdresses", (expBuilder, qEntity) => {
        expBuilder.filter(qEntity.street.equals("AC/DC & Brothers"));
      })
      .build();
    const expected = addBase(
      "%24select=name%2Cage&%24expand=altAdresses(%24filter%3Dstreet%20eq%20'AC%2FDC%20%26%20Brothers')"
    );

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

  test("count", () => {
    const candidate = toTest.count().build();
    const expected = addBase("$count=true");

    expect(candidate).toBe(expected);
  });

  test("count: true", () => {
    const candidate = toTest.count(true).build();
    const expected = addBase("$count=true");

    expect(candidate).toBe(expected);
  });

  test("count: false", () => {
    const candidate = toTest.count(false).build();
    const expected = addBase("$count=false");

    expect(candidate).toBe(expected);
  });

  test("filter: simple", () => {
    const candidate = toTest.filter(QPerson.name.eq("Heinz")).build();
    const expected = addBase("$filter=name eq 'Heinz'");

    expect(candidate).toBe(expected);
  });

  test("filter: 2 filters", () => {
    const candidate = toTest.filter(QPerson.name.eq("Heinz"), QPerson.age.eq(8)).build();
    const expected = addBase("$filter=name eq 'Heinz' and age eq 8");

    expect(candidate).toBe(expected);
  });

  test("filter: multiple times", () => {
    const candidate = toTest.filter(QPerson.name.eq("Heinz")).filter(QPerson.age.eq(8)).build();
    const expected = addBase("$filter=name eq 'Heinz' and age eq 8");

    expect(candidate).toBe(expected);
  });

  test("filter: add expression manually", () => {
    const candidate = toTest.filter(new QExpression("name eq 'Heinz'").and(new QExpression("age eq 8"))).build();
    const expected = addBase("$filter=name eq 'Heinz' and age eq 8");

    expect(candidate).toBe(expected);
  });

  /*
  test("filterOr: simple", () => {
    const candidate = toTest.filterOr(QPerson.name.eq("Heinz")).build();
    const expected = addBase("$filter=name eq 'Heinz'");

    expect(candidate).toBe(expected);
  });

  test("filterOr: 2 filters", () => {
    const candidate = toTest.filterOr(QPerson.name.eq("Heinz"), QPerson.age.ge(12)).build();
    const expected = addBase("$filter=name eq 'Heinz' or age ge 12");

    expect(candidate).toBe(expected);
  });

  test("filterOr: multiple times", () => {
    const candidate = toTest
      .filterOr(QPerson.name.eq("Heinz"), QPerson.age.ge(12))
      .filterOr(QPerson.deceased.isTrue(), QPerson.age.gt(50))
      .build();
    const expected = addBase("$filter=(name eq 'Heinz' or age ge 8) and (deceased eq true or age gt 50)");

    expect(candidate).toBe(expected);
  });
  */

  test("expand: simple", () => {
    const candidate = toTest.expand("address").build();
    const expected = addBase("$expand=address");

    expect(candidate).toBe(expected);
  });

  test("expand: two simple ones", () => {
    const candidate = toTest.expand("address", "altAdresses").build();
    const expected = addBase("$expand=address,altAdresses");

    expect(candidate).toBe(expected);
  });

  test("expanding: simple", () => {
    const candidate = toTest.expanding("address", (builder) => {}).build();
    const expected = addBase("$expand=address");

    expect(candidate).toBe(expected);
  });

  test("expandiong: with select", () => {
    const candidate = toTest
      .expanding("address", (builder) => {
        builder.select("street");
      })
      .build();
    const expected = addBase("$expand=address($select=street)");

    expect(candidate).toBe(expected);
  });

  test("expanding: 1:n with filter & skip & top", async () => {
    const candidate = toTest
      .expanding("altAdresses", (builder, qEntity) => {
        builder.select("street").skip(1).top(0).filter(qEntity.street.equals("Teststr. 12"));
      })
      .build();
    const expected = addBase("$expand=altAdresses($select=street;$skip=1;$top=0;$filter=street eq 'Teststr. 12')");

    expect(candidate).toBe(expected);
  });

  test("expanding: deeply nested", () => {
    const candidate = toTest
      .select("name", "age")
      .expanding("address", (builder, qAddress) => {
        builder
          .select("street")
          .filter(qAddress.street.startsWith("Kam"))
          .expanding("responsible", (respExpand) => {
            respExpand.select("name");
          });
      })
      .build();
    const expected = addBase(
      "$select=name,age&$expand=address($select=street;$filter=startswith(street,'Kam');$expand=responsible($select=name))"
    );

    expect(candidate).toBe(expected);
  });

  test("combining simple & complex expand", () => {
    const candidate = toTest
      .expanding("address", (builder) => {
        builder.select("street");
      })
      .expand("altAdresses")
      .build();
    const expected = addBase("$expand=address($select=street),altAdresses");

    expect(candidate).toBe(expected);
  });
});
