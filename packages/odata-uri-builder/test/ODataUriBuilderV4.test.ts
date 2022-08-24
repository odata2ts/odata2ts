import { createUriBuilderV4, ODataUriBuilderV4 } from "../src/";
import { QPerson, qPerson } from "./fixture/types/QSimplePersonModel";
import { createBaseTests } from "./ODataUriBuilderBaseTests";

/**
 * Helper function which adds the base path.
 *
 * @param urlPart
 * @returns
 */
function addBase(urlPart: string) {
  return `/Persons${urlPart ? `?${urlPart}` : ""}`;
}

describe("ODataUriBuilderV4 Test", () => {
  let toTest: ODataUriBuilderV4<QPerson>;

  // @ts-ignore: hard to get the right typing right, so we always use the V2 model as common ground
  // all we care about here, ist that V4 covers all the functionally V2 has
  createBaseTests(createUriBuilderV4);

  function refresh() {
    toTest = createUriBuilderV4("/Persons", qPerson, { unencoded: true });
  }

  /**
   * Always use a new builder for each  test.
   */
  beforeEach(() => {
    refresh();
  });

  test("config: encoded & no double encoding for expanded entities", () => {
    const candidate = createUriBuilderV4("/Persons", qPerson)
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
    const expected = addBase("$count=true");

    expect(toTest.count().build()).toBe(expected);
    refresh();
    expect(toTest.count(true).build()).toBe(expected);
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

  test("expanding: ignore null function", () => {
    const expected = addBase("");

    expect(toTest.expanding("address", null).build()).toBe(expected);
    expect(toTest.expanding("address", undefined).build()).toBe(expected);
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
    const expected = addBase("$expand=AltAdresses($select=street;$filter=street eq 'Teststr. 12';$top=0;$skip=1)");

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
      "$select=name,age&$expand=Address($select=street;$expand=responsible($select=name);$filter=startswith(street,'Kam'))"
    );

    expect(candidate).toBe(expected);
  });

  test("expanding: combining simple & complex expand", () => {
    const candidate = toTest
      .expanding("address", (builder) => {
        builder.select("street");
      })
      .expand("altAdresses")
      .build();
    const expected = addBase("$expand=Address($select=street),AltAdresses");

    expect(candidate).toBe(expected);
  });

  test("groupBy", () => {
    expect(toTest.groupBy("name").build()).toBe(addBase("$apply=groupby((name))"));
    refresh();
    expect(toTest.groupBy("name", "age").build()).toBe(addBase("$apply=groupby((name,age))"));
  });

  test("groupBy: ignore nullable", () => {
    const expected = addBase("");

    expect(toTest.groupBy(null).build()).toBe(expected);
    expect(toTest.groupBy(undefined).build()).toBe(expected);
    expect(toTest.groupBy("name", null, undefined, "age").build()).toBe(addBase("$apply=groupby((name,age))"));
  });

  test("groupBy: consecutive", () => {
    const candidate = toTest.groupBy("name").groupBy("age").build();

    expect(candidate).toBe(addBase("$apply=groupby((name,age))"));
  });

  test("search with single term", () => {
    const candidate = toTest.search("testing").build();

    expect(candidate).toBe(addBase("$search=testing"));
  });

  test("search with phrase", () => {
    const candidate = toTest.search("testing more").build();

    expect(candidate).toBe(addBase('$search="testing more"'));
  });

  test("search with no term", () => {
    const noopPath = addBase("");

    expect(toTest.search(undefined).build()).toBe(noopPath);
    expect(toTest.search(null).build()).toBe(noopPath);
    expect(toTest.search("").build()).toBe(noopPath);
    expect(toTest.search(" ").build()).toBe(addBase('$search=" "'));
  });
});
