import { ODataUriBuilderV2 } from "../src";
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

describe("ODataUriBuilderV2 Test", () => {
  let toTest: ODataUriBuilderV2<QPerson>;

  createBaseTests(ODataUriBuilderV2.create);

  /**
   * Always use a new builder for each  test.
   */
  beforeEach(() => {
    toTest = ODataUriBuilderV2.create("/Persons", qPerson, { unencoded: true });
  });

  test("count: true", () => {
    const candidate = toTest.count(true).build();
    const candidate2 = toTest.count().build();
    const expected = addBase("$inlinecount=allpages");

    expect(candidate).toBe(expected);
    expect(candidate).toBe(candidate2);
  });

  test("count: false", () => {
    const candidate = toTest.count(false).build();
    const expected = "/Persons";

    expect(candidate).toBe(expected);
  });

  test("expanding: selecting nested prop", () => {
    const candidate = toTest.expanding("address", (builder) => builder.select("street")).build();
    const expected = addBase("$select=Address/street&$expand=Address");

    expect(candidate).toBe(expected);
  });

  test("expanding: selecting nested prop mixed with selects and expands", () => {
    const candidate = toTest
      .select("name")
      .expand("altAdresses")
      .expanding("address", (builder) => builder.select("street"))
      .build();
    const expected = addBase("$select=name,Address/street&$expand=AltAdresses,Address");

    expect(candidate).toBe(expected);
  });

  test("select: deeply nested prop", () => {
    const candidate = toTest
      .expanding("address", (builder) => {
        builder.expanding("responsible", (respBuilder) => {
          respBuilder.select("name").expand("address");
        });
      })
      .build();

    const expected = addBase(
      "$select=Address/responsible/name&$expand=Address,Address/responsible,Address/responsible/Address"
    );

    expect(candidate).toBe(expected);
  });

  /*test("expanding: nested expand", () => {
      const candidate = toTest.expanding("address", (q) => q.responsible).build();
      const expected = addBase("$expand=Address/responsible");

      expect(candidate).toBe(expected);
    });*/
});
