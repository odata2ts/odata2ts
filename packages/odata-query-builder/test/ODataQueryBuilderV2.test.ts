import { QSelectExpression } from "@odata2ts/odata-query-objects";
import { beforeEach, describe, expect, test } from "vitest";
import { CollectionQueryBuilderV2, createQueryBuilderV2 } from "../src";
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
  let toTest: CollectionQueryBuilderV2<QPerson>;

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

  test("expand: simple", () => {
    const candidate = toTest.expand("bestFriend").build();
    const expected = addBase("$expand=bestFriend");

    expect(candidate).toBe(expected);
  });

  test("expand: two simple ones", () => {
    const candidate = toTest.expand("bestFriend", "friends").build();
    const expected = addBase("$expand=bestFriend,friends");

    expect(candidate).toBe(expected);
  });

  test("expand: custom prop", () => {
    const candidate = toTest.expand(new QSelectExpression("XXX")).build();
    const expected = addBase("$expand=XXX");

    expect(candidate).toBe(expected);
  });

  test("expand: mixed with custom prop", () => {
    const candidate = toTest.expand(new QSelectExpression("x_yz"), "bestFriend").build();
    const expected = addBase("$expand=x_yz,bestFriend");

    expect(candidate).toBe(expected);
  });

  test("expand: ignore nullables", () => {
    const expectedNull = addBase("");
    const expected = addBase("$expand=bestFriend");

    expect(toTest.expand(null).build()).toBe(expectedNull);
    expect(toTest.expand(undefined).build()).toBe(expectedNull);
    expect(toTest.expand("bestFriend", undefined, null).build()).toBe(expected);
  });

  test("expand: also works for complex types and collections in V2", () => {
    // unlike V4, V2 doesn't auto-inline complex types - $expand is required for them to appear at all
    const candidate = toTest.expand("address", "altAddresses").build();
    const expected = addBase("$expand=Address,AltAdresses");

    expect(candidate).toBe(expected);
  });

  test("expand: wildcard is not a valid expand target", () => {
    // @ts-expect-error - "*" is a select()-only wildcard, not usable with V2's widened expand() either
    toTest.expand("*");
  });

  test("expanding: simple", () => {
    const candidate = toTest.expanding("bestFriend", () => {}).build();
    const expected = addBase("$expand=bestFriend");

    expect(candidate).toBe(expected);
  });

  test("expanding: error without prop", () => {
    const expectedMsg = "Expanding prop must be defined!";

    expect(() =>
      // @ts-ignore
      toTest.expanding(null, null),
    ).toThrow(expectedMsg);
    expect(() =>
      // @ts-ignore
      toTest.expanding(undefined, null),
    ).toThrow(expectedMsg);
  });

  test("expanding: ignore null function", () => {
    const expected = addBase("");

    expect(toTest.expanding("bestFriend", null).build()).toBe(expected);
    expect(toTest.expanding("bestFriend", undefined).build()).toBe(expected);
    expect(toTest.expanding("bestFriend", (builder) => builder.expanding("bestFriend", undefined)).build()).toBe(
      addBase("$expand=bestFriend"),
    );
  });

  test("expanding: selecting nested prop", () => {
    const candidate = toTest.expanding("bestFriend", (builder) => builder.select("age")).build();
    const expected = addBase("$select=bestFriend/age&$expand=bestFriend");

    expect(candidate).toBe(expected);
  });

  test("expanding: wildcard select on nav prop flattens to prefix/*", () => {
    const candidate = toTest.expanding("bestFriend", (builder) => builder.select("*")).build();
    const expected = addBase("$select=bestFriend/*&$expand=bestFriend");

    expect(candidate).toBe(expected);
  });

  test("expanding: wildcard select on complex prop flattens to prefix/*", () => {
    const candidate = toTest.expanding("address", (builder) => builder.select("*")).build();
    const expected = addBase("$select=Address/*&$expand=Address");

    expect(candidate).toBe(expected);
  });

  test("expanding: selecting nested prop mixed with selects and expands", () => {
    const candidate = toTest
      .select("name")
      .expand("friends")
      .expanding("bestFriend", (builder) => builder.select("age"))
      .build();
    const expected = addBase("$select=name,bestFriend/age&$expand=friends,bestFriend");

    expect(candidate).toBe(expected);
  });

  test("expanding: complex prop - flattened like an entity nav prop", () => {
    const candidate = toTest.expanding("address", (builder) => builder.select("street")).build();
    const expected = addBase("$select=Address/street&$expand=Address");

    expect(candidate).toBe(expected);
  });

  test("expanding: entity nested inside complex prop", () => {
    const candidate = toTest
      .expanding("address", (builder) => {
        builder.expanding("responsible", (respBuilder) => {
          respBuilder.select("name");
        });
      })
      .build();
    const expected = addBase("$select=Address/responsible/name&$expand=Address,Address/responsible");

    expect(candidate).toBe(expected);
  });

  test("expanding: complex prop nested inside entity", () => {
    const candidate = toTest
      .expanding("bestFriend", (builder) => {
        builder.expanding("address", (addrBuilder) => {
          addrBuilder.select("street");
        });
      })
      .build();
    const expected = addBase("$select=bestFriend/Address/street&$expand=bestFriend,bestFriend/Address");

    expect(candidate).toBe(expected);
  });

  test("expanding: complex prop nested inside complex prop", () => {
    const candidate = toTest
      .expanding("address", (builder) => {
        builder.expanding("geo", (geoBuilder) => {
          geoBuilder.select("lat");
        });
      })
      .build();
    const expected = addBase("$select=Address/geo/lat&$expand=Address,Address/geo");

    expect(candidate).toBe(expected);
  });

  test("select: deeply nested prop", () => {
    const candidate = toTest
      .expanding("bestFriend", (builder) => {
        builder.expanding("bestFriend", (respBuilder) => {
          respBuilder
            .select("name", new QSelectExpression("xxx"))
            .expand("bestFriend", new QSelectExpression("CUSTOM"));
        });
      })
      .build();

    const expected = addBase(
      "$select=bestFriend/bestFriend/name,bestFriend/bestFriend/xxx&$expand=bestFriend,bestFriend/bestFriend,bestFriend/bestFriend/bestFriend,bestFriend/bestFriend/CUSTOM",
    );

    expect(candidate).toBe(expected);
  });

  test("clone: all fields set", () => {
    toTest
      .select("name", "age")
      .filter(qPerson.name.eq("Horst"))
      .expand("friends")
      .count()
      .top(10)
      .skip(20)
      .orderBy(qPerson.name.asc());

    const result = toTest.clone();

    expect(JSON.stringify(result)).toStrictEqual(JSON.stringify(toTest));
  });
});
