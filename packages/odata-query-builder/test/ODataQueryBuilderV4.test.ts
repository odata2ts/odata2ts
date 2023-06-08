import { searchTerm } from "@odata2ts/odata-query-objects";

import { ODataQueryBuilderV4, createQueryBuilderV4 } from "../src/";
import { QPerson, qPerson } from "./fixture/types/QSimplePersonModel";
import { createBaseTests } from "./ODataQueryBuilderBaseTests";

/**
 * Helper function which adds the base path.
 *
 * @param urlPart
 * @returns
 */
function addBase(urlPart: string) {
  return `/Persons${urlPart ? `?${urlPart}` : ""}`;
}

describe("ODataQueryBuilderV4 Test", () => {
  let toTest: ODataQueryBuilderV4<QPerson>;
  let toTest2: ODataQueryBuilderV4<QPerson>;

  // @ts-ignore: hard to get the typing right here, so we always use the V2 model as common ground
  // all we care about here, is that V4 covers all the functionally V2 has
  createBaseTests(createQueryBuilderV4);

  function refresh() {
    toTest = createQueryBuilderV4("/Persons", qPerson, { unencoded: true });
    toTest2 = createQueryBuilderV4("/Persons", qPerson, { unencoded: true });
  }

  /**
   * Always use a new builder for each  test.
   */
  beforeEach(() => {
    refresh();
  });

  test("config: encoded & no double encoding for expanded entities", () => {
    const candidate = createQueryBuilderV4("/Persons", qPerson)
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

  test("expanding: error without prop", () => {
    const expectedMsg = "Expanding prop must be defined!";

    expect(() =>
      // @ts-ignore
      toTest.expanding(null, null)
    ).toThrow(expectedMsg);
    expect(() =>
      // @ts-ignore
      toTest.expanding(undefined, null)
    ).toThrow(expectedMsg);
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

  test("expanding: nested expanding", () => {
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

  test("expanding: nested expand", () => {
    const candidate = toTest
      .expanding("address", (builder, qAddress) => {
        builder.expand("responsible");
      })
      .build();
    const expected = addBase("$expand=Address($expand=responsible)");

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

  test("expanding: orderBy", () => {
    const candidate = toTest
      .expanding("altAdresses", (builder, qAddress) => {
        builder.orderBy(qAddress.street.asc());
      })
      .build();
    const expected = addBase("$expand=AltAdresses($orderby=street asc)");

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
    const candidate2 = toTest2.search(searchTerm("testing")).build();

    expect(candidate).toBe(addBase("$search=testing"));
    expect(candidate2).toBe(candidate);
  });

  test("search with phrase", () => {
    const candidate = toTest.search("testing more").build();
    const candidate2 = toTest2.search(searchTerm("testing more")).build();

    expect(candidate).toBe(addBase('$search="testing more"'));
    expect(candidate2).toBe(candidate);
  });

  test("search with no term", () => {
    const noopPath = addBase("");

    expect(toTest.search(undefined).build()).toBe(noopPath);
    expect(toTest.search(searchTerm(undefined)).build()).toBe(noopPath);
    expect(toTest.search(null).build()).toBe(noopPath);
    expect(toTest.search(searchTerm(null)).build()).toBe(noopPath);
    expect(toTest.search("").build()).toBe(noopPath);
    expect(toTest.search(" ").build()).toBe(noopPath);
    expect(toTest.search(searchTerm(" ")).build()).toBe(noopPath);
  });

  test("search with multiple terms", () => {
    const candidate = toTest.search("testing", "test2", "phrase is a phrase").build();
    const candidate2 = toTest2.search(searchTerm("testing"), "test2", searchTerm("phrase is a phrase")).build();

    expect(candidate).toBe(addBase('$search=testing AND test2 AND "phrase is a phrase"'));
    expect(candidate2).toBe(candidate);
  });

  test("search: ignore nullables", () => {
    const candidate = toTest.search("testing", null, searchTerm(null), "test2", undefined).build();

    expect(candidate).toBe(addBase("$search=testing AND test2"));
  });

  test("search: with operators", () => {
    const candidate = toTest.search(searchTerm("testing").not().and("test2").or("phrase is a phrase")).build();

    expect(candidate).toBe(addBase('$search=(NOT testing AND test2 OR "phrase is a phrase")'));
  });
});
