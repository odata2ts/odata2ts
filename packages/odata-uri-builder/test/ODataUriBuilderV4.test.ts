import { ODataUriBuilderV4 } from "../src/";
import { QPerson, qPerson } from "./fixture/types/QSimplePersonModel";
import { createBaseTests } from "./ODataUriBuilderBaseTests";

/**
 * Helper function which adds the base path.
 *
 * @param urlPart
 * @returns
 */
function addBase(urlPart: string) {
  return `/Persons?${urlPart}`;
}

describe("ODataUriBuilderV4 Test", () => {
  let toTest: ODataUriBuilderV4<QPerson>;

  createBaseTests(ODataUriBuilderV4.create);

  /**
   * Always use a new builder for each  test.
   */
  beforeEach(() => {
    toTest = ODataUriBuilderV4.create("/Persons", qPerson, { unencoded: true });
  });

  test("config: encoded & no double encoding for expanded entities", () => {
    const candidate = ODataUriBuilderV4.create("/Persons", qPerson)
      .select("name", "age")
      .expanding("altAdresses", (expBuilder, qEntity) => {
        expBuilder.filter(qEntity.street.equals("AC/DC & Brothers"));
      })
      .build();
    const expected = addBase(
      "%24select=name%2Cage&%24expand=AltAdresses(%24filter%3Dstreet%20eq%20'AC%2FDC%20%26%20Brothers')"
    );

    expect(candidate).toBe(expected);
  });

  test("count", () => {
    const candidate = toTest.count().build();
    const candidate2 = toTest.count(true).build();
    const expected = addBase("$count=true");

    expect(candidate).toBe(expected);
    expect(candidate).toBe(candidate2);
  });

  test("count: false", () => {
    const candidate = toTest.count(false).build();
    const expected = addBase("$count=false");

    expect(candidate).toBe(expected);
  });

  test("expanding: simple", () => {
    const candidate = toTest.expanding("address", () => {}).build();
    const expected = addBase("$expand=Address");

    expect(candidate).toBe(expected);
  });

  test("expanding: with select", () => {
    const candidate = toTest
      .expanding("address", (builder) => {
        builder.select("street");
      })
      .build();
    const expected = addBase("$expand=Address($select=street)");

    expect(candidate).toBe(expected);
  });

  test("expanding: 1:n with filter & skip & top", async () => {
    const candidate = toTest
      .expanding("altAdresses", (builder, qEntity) => {
        builder.select("street").skip(1).top(0).filter(qEntity.street.equals("Teststr. 12"));
      })
      .build();
    const expected = addBase("$expand=AltAdresses($select=street;$skip=1;$top=0;$filter=street eq 'Teststr. 12')");

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
      "$select=name,age&$expand=Address($select=street;$filter=startswith(street,'Kam');$expand=responsible($select=name))"
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
    const expected = addBase("$expand=Address($select=street),AltAdresses");

    expect(candidate).toBe(expected);
  });

  test("simple groupBy", () => {
    const candidate = toTest.select("name").groupBy("name").build();

    expect(candidate).toBe(addBase("$select=name&$apply=groupby((name))"));
  });

  test("multiple groupBys", () => {
    const candidate = toTest.select("name", "age").groupBy("name", "age").build();

    expect(candidate).toBe(addBase("$select=name,age&$apply=groupby((name,age))"));
  });

  test("search", () => {
    const candidate = toTest.search("testing").build();

    expect(candidate).toBe(addBase("$search='testing'"));
  });
});
