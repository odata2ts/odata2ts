import { QSelectExpression, searchTerm } from "@odata2ts/odata-query-objects";
import { beforeEach, describe, expect, test } from "vitest";
import { CollectionQueryBuilderV4, createQueryBuilderV4 } from "../src";
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
  let toTest: CollectionQueryBuilderV4<QPerson>;
  let toTest2: CollectionQueryBuilderV4<QPerson>;

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
      .expanding("friends", (expBuilder, qEntity) => {
        expBuilder.filter(qEntity.name.equals("AC/DC & Brothers"));
      })
      .build();
    const expected = addBase(
      "%24select=name%2Cage&%24expand=friends(%24filter%3Dname%20eq%20'AC%2FDC%20%26%20Brothers')",
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

  test("expand: won't work for complex types or collections", () => {
    // @ts-expect-error - an expandPath can never terminate on a bare complex property, use expanding() instead
    toTest.expand("likedFeatures");
    // @ts-expect-error
    toTest.expand("address");
    // @ts-expect-error
    toTest.expand("altAddresses");
  });

  test("expand: wildcard is not a valid expand target", () => {
    // @ts-expect-error - "*" is a select()-only wildcard; $expand=* is a distinct, unsupported feature
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
  });

  test("expanding: with select", () => {
    const candidate = toTest
      .expanding("bestFriend", (builder) => {
        builder.select("age");
      })
      .build();
    const expected = addBase("$expand=bestFriend($select=age)");

    expect(candidate).toBe(expected);
  });

  test("expanding: 1:n with filter & count & skip & top", async () => {
    const candidate = toTest
      .expanding("friends", (builder, qEntity) => {
        builder.select("name").count().skip(1).top(0).filter(qEntity.name.equals("Teststr. 12"));
      })
      .build();
    const expected = addBase("$expand=friends($select=name;$filter=name eq 'Teststr. 12';$count=true;$top=0;$skip=1)");

    expect(candidate).toBe(expected);
  });

  test("expanding: nested expanding", () => {
    const candidate = toTest
      .select("name", "age")
      .expanding("friends", (builder, qFriend) => {
        builder
          .select("name")
          .filter(qFriend.name.startsWith("Kam"))
          .expanding("bestFriend", (respExpand) => {
            respExpand.select("name");
          });
      })
      .build();
    const expected = addBase(
      "$select=name,age&$expand=friends($select=name;$expand=bestFriend($select=name);$filter=startswith(name,'Kam'))",
    );

    expect(candidate).toBe(expected);
  });

  test("expanding: nested expand", () => {
    const candidate = toTest
      .expanding("bestFriend", (builder) => {
        builder.expand("bestFriend");
      })
      .build();
    const expected = addBase("$expand=bestFriend($expand=bestFriend)");

    expect(candidate).toBe(expected);
  });

  test("expanding: with custom prop", () => {
    const candidate = toTest
      .expanding("bestFriend", (builder) => {
        builder.select(new QSelectExpression("THE1")).expand(new QSelectExpression("xxx"));
      })
      .build();
    const expected = addBase("$expand=bestFriend($select=THE1;$expand=xxx)");

    expect(candidate).toBe(expected);
  });

  test("expanding: combining simple & complex expand", () => {
    const candidate = toTest
      .expanding("bestFriend", (builder) => {
        builder.select("name");
      })
      .expand("friends")
      .build();
    const expected = addBase("$expand=bestFriend($select=name),friends");

    expect(candidate).toBe(expected);
  });

  test("expanding: orderBy", () => {
    const candidate = toTest
      .expanding("friends", (builder, qPerson) => {
        builder.orderBy(qPerson.name.asc());
      })
      .build();
    const expected = addBase("$expand=friends($orderby=name asc)");

    expect(candidate).toBe(expected);
  });

  test("expanding: wildcard select on nav prop renders as $expand=prop($select=*)", () => {
    const candidate = toTest.expanding("bestFriend", (builder) => builder.select("*")).build();
    const expected = addBase("$expand=bestFriend($select=*)");

    expect(candidate).toBe(expected);
  });

  test("expanding: wildcard mixed with named prop inside expanding", () => {
    const candidate = toTest.expanding("bestFriend", (builder) => builder.select("*", "name")).build();
    const expected = addBase("$expand=bestFriend($select=*,name)");

    expect(candidate).toBe(expected);
  });

  test("expanding: wildcard select on complex prop renders inline as $select=prop($select=*)", () => {
    const candidate = toTest.expanding("address", (builder) => builder.select("*")).build();
    const expected = addBase("$select=Address($select=*)");

    expect(candidate).toBe(expected);
  });

  test("expanding: single complex prop renders as $select, no $expand", () => {
    const candidate = toTest.expanding("address", (builder) => builder.select("street")).build();
    const expected = addBase("$select=Address($select=street)");

    expect(candidate).toBe(expected);
  });

  test("expanding: complex collection prop keeps collection-only ops incl. search", () => {
    const candidate = toTest
      .expanding("altAddresses", (builder, qAddr) => {
        builder.select("street").filter(qAddr.street.startsWith("H")).count().top(1).skip(0).search("berlin");
      })
      .build();
    const expected = addBase(
      "$select=AltAdresses($select=street;$filter=startswith(street,'H');$count=true;$top=1;$skip=0;$search=berlin)",
    );

    expect(candidate).toBe(expected);
  });

  test("expanding: entity nested inside complex prop gets hoisted to the nearest $expand", () => {
    const candidate = toTest
      .expanding("address", (builder) => {
        builder.select("street").expanding("responsible", (respBuilder) => {
          respBuilder.select("name");
        });
      })
      .build();
    const expected = addBase("$select=Address($select=street)&$expand=Address/responsible($select=name)");

    expect(candidate).toBe(expected);
  });

  test("expanding: complex prop nested inside entity stays inline", () => {
    const candidate = toTest
      .expanding("bestFriend", (builder) => {
        builder.expanding("address", (addrBuilder) => {
          addrBuilder.select("street");
        });
      })
      .build();
    const expected = addBase("$expand=bestFriend($select=Address($select=street))");

    expect(candidate).toBe(expected);
  });

  test("expanding: complex prop nested inside complex prop stays inline", () => {
    const candidate = toTest
      .expanding("address", (builder) => {
        builder.expanding("geo", (geoBuilder) => {
          geoBuilder.select("lat");
        });
      })
      .build();
    const expected = addBase("$select=Address($select=geo($select=lat))");

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

  test("clone: all fields set", () => {
    toTest
      .select("name", "age")
      .filter(qPerson.name.eq("Horst"))
      .expand("friends")
      .count()
      .top(10)
      .skip(20)
      .orderBy(qPerson.name.asc())
      .search("hey")
      .groupBy("address");

    const result = toTest.clone();

    expect(JSON.stringify(result)).toStrictEqual(JSON.stringify(toTest));
  });
});
