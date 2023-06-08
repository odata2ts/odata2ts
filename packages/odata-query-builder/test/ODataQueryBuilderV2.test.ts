import { ODataQueryBuilderV2, createQueryBuilderV2 } from "../src/";
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

describe("ODataQueryBuilderV2 Test", () => {
  let toTest: ODataQueryBuilderV2<QPerson>;

  createBaseTests(createQueryBuilderV2);

  /**
   * Always use a new builder for each  test.
   */
  beforeEach(() => {
    toTest = createQueryBuilderV2("/Persons", qPerson, { unencoded: true });
  });

  test("count: true", () => {
    const expected = addBase("$inlinecount=allpages");

    expect(toTest.count().build()).toBe(expected);
    expect(toTest.count(true).build()).toBe(expected);
  });

  test("count: false", () => {
    const candidate = toTest.count(false).build();
    const expected = "/Persons";

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
    expect(toTest.expanding("address", (builder) => builder.expanding("responsible", undefined)).build()).toBe(
      addBase("$expand=Address")
    );
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
});
