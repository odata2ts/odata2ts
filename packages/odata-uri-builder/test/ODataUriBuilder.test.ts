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

  test("minimal default", () => {
    expect(toTest.build()).toBe("/Persons");
  });

  test("fail with empty collection", () => {
    // @ts-ignore
    expect(() => ODataUriBuilder.create(null)).toThrow();
    // @ts-expect-error
    expect(() => ODataUriBuilder.create()).toThrow();
    // @ts-expect-error
    expect(() => ODataUriBuilder.create({})).toThrow();
    expect(() => ODataUriBuilder.create({ entityName: " " })).toThrow();
  });

  // TODO check config

  test("select 2 props", () => {
    const candidate = toTest.select("name", "age").build();
    const expected = addBase("$select=name,age");

    expect(candidate).toBe(expected);
  });

  /*
  TODO: ignore null / undefined to support evaluations & select nothing is also not problematic
  test("fail with null or empty clause", () => {
    expect(() => toTest.select(qEmployee.id, null)).toThrow();
    expect(() => toTest.select(qEmployee.id, undefined)).toThrow();
    expect(() => toTest.select()).toThrow();
  });
 */

  test("test skip", () => {
    const candidate = toTest.skip(5).build();
    const expected = addBase("$skip=5");

    expect(candidate).toBe(expected);
  });

  test("test skip with zero", () => {
    const candidate = toTest.skip(0).build();
    const expected = addBase("$skip=0");

    expect(candidate).toBe(expected);
  });

  test("fail skip with negative number", () => {
    expect(() => toTest.skip(-2)).toThrow();
  });

  test("test top", () => {
    const candidate = toTest.top(15).build();
    const expected = addBase("$top=15");

    expect(candidate).toBe(expected);
  });

  test("test top with zero", () => {
    const candidate = toTest.top(0).build();
    const expected = addBase("$top=0");

    expect(candidate).toBe(expected);
  });

  test("fail top with negative number", () => {
    expect(() => toTest.top(-1)).toThrow();
  });

  test("test count", () => {
    const candidate = toTest.count().build();
    const expected = addBase("$count=true");

    expect(candidate).toBe(expected);
  });

  test("test count=true", () => {
    const candidate = toTest.count(true).build();
    const expected = addBase("$count=true");

    expect(candidate).toBe(expected);
  });

  test("test count=false", () => {
    const candidate = toTest.count(false).build();
    const expected = addBase("$count=false");

    expect(candidate).toBe(expected);
  });

  test("simple filter", () => {
    const candidate = toTest.filter(QPerson.name.eq("Heinz")).build();
    const expected = addBase("$filter=name eq 'Heinz'");

    expect(candidate).toBe(expected);
  });

  test("multiple filter", () => {
    const candidate = toTest.filter(QPerson.name.eq("Heinz"), QPerson.age.eq(8)).build();
    const expected = addBase("$filter=name eq 'Heinz' and age eq 8");

    expect(candidate).toBe(expected);
  });

  test("add filter multiple times", () => {
    const candidate = toTest.filter(QPerson.name.eq("Heinz")).filter(QPerson.age.eq(8)).build();
    const expected = addBase("$filter=name eq 'Heinz' and age eq 8");

    expect(candidate).toBe(expected);
  });

  test("add filter expression manually", () => {
    const candidate = toTest.filter(new QExpression("name eq 'Heinz'").and(new QExpression("age eq 8"))).build();
    const expected = addBase("$filter=name eq 'Heinz' and age eq 8");

    expect(candidate).toBe(expected);
  });

  test("one simple expand", () => {
    const candidate = toTest.expand("address").build();
    const expected = addBase("$expand=address");

    expect(candidate).toBe(expected);
  });

  test("two simple expands", () => {
    const candidate = toTest.expand("address", "altAdresses").build();
    const expected = addBase("$expand=address,altAdresses");

    expect(candidate).toBe(expected);
  });

  test("one fairly simple expand", () => {
    const candidate = toTest.expanding("address", (builder) => {}).build();
    const expected = addBase("$expand=address");

    expect(candidate).toBe(expected);
  });

  test("one expand with select", () => {
    const candidate = toTest
      .expanding("address", (builder) => {
        builder.select("street");
      })
      .build();
    const expected = addBase("$expand=address($select=street)");

    expect(candidate).toBe(expected);
  });

  test("expand 1:n with filter & skip & top", async () => {
    const candidate = toTest
      .expanding("altAdresses", (builder, qEntity) => {
        builder.select("street").skip(1).top(0).filter(qEntity.street.equals("Teststr. 12"));
      })
      .build();
    const expected = addBase("$expand=altAdresses($select=street;$skip=1;$top=0;$filter=street eq 'Teststr. 12')");

    expect(candidate).toBe(expected);
  });

  test("deeply nested expand", () => {
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
