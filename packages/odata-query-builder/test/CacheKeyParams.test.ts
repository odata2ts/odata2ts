import { QFilterExpression, QStringPath } from "@odata2ts/odata-query-objects";
import { beforeEach, describe, expect, test } from "vitest";
import { createExpandingQueryBuilderV4 } from "../src";
import { ODataQueryBuilder } from "../src/ODataQueryBuilder";
import { QPerson, qPerson } from "./fixture/types/QSimplePersonModel";

describe("CacheKeyParams", () => {
  let builder: ODataQueryBuilder<QPerson>;

  beforeEach(() => {
    builder = new ODataQueryBuilder("Persons", qPerson);
  });

  test("an untouched builder contributes nothing", () => {
    expect(builder.getCacheKeyParams()).toBeUndefined();
  });

  test("select and expand are sorted, their order carries no meaning", () => {
    // addSelects/addExpands take raw path strings, not tied to the fixture's own properties.
    builder.addSelects("UserName", "Age", "Name");
    builder.addExpands("Friends", "BestFriend");
    expect(builder.getCacheKeyParams()).toEqual({
      select: ["Age", "Name", "UserName"],
      expand: ["BestFriend", "Friends"],
    });
  });

  test("orderBy keeps source order, which does carry meaning", () => {
    builder.orderBy([qPerson.age.desc(), qPerson.name.asc()]);
    expect(builder.getCacheKeyParams()).toEqual({ orderBy: ["age desc", "name asc"] });
  });

  test("top, skip and count come through as they are", () => {
    builder.top(10);
    builder.skip(20);
    builder.count();
    expect(builder.getCacheKeyParams()).toEqual({ top: 10, skip: 20, count: true });
  });

  test("count(false) contributes nothing", () => {
    builder.count(false);
    expect(builder.getCacheKeyParams()).toBeUndefined();
  });

  test("countV2 counts as count", () => {
    builder.countV2();
    expect(builder.getCacheKeyParams()).toEqual({ count: true });
  });

  test("search is the rendered term", () => {
    builder.search(["ai"]);
    expect(builder.getCacheKeyParams()).toEqual({ search: "ai" });
  });

  test("several filter calls fold into one map", () => {
    builder.filter([qPerson.age.gt(18)]);
    builder.filter([qPerson.name.eq("russell")]);
    expect(builder.getCacheKeyParams()).toEqual({ filter: { age: { gt: 18 }, name: "russell" } });
  });

  test("a single eq clause collapses to the bare value", () => {
    builder.filter([qPerson.name.eq("russell")]);
    expect(builder.getCacheKeyParams()).toEqual({ filter: { name: "russell" } });
  });

  test("a non-eq operator becomes an object", () => {
    builder.filter([qPerson.age.ne(3)]);
    expect(builder.getCacheKeyParams()).toEqual({ filter: { age: { ne: 3 } } });
  });

  test("several clauses on one path become an array in source order", () => {
    builder.filter([qPerson.age.gt(2000).and(qPerson.age.lt(2020))]);
    expect(builder.getCacheKeyParams()).toEqual({ filter: { age: [{ gt: 2000 }, { lt: 2020 }] } });
  });

  test("two eq clauses on one path also become an array", () => {
    builder.filter([qPerson.age.eq(1).and(qPerson.age.eq(2))]);
    expect(builder.getCacheKeyParams()).toEqual({ filter: { age: [{ eq: 1 }, { eq: 2 }] } });
  });

  test("raw fragments are joined with ' and ' in source order under $raw", () => {
    builder.filter([new QFilterExpression("(A eq 1 or B eq 2)")]);
    builder.filter([new QFilterExpression("contains(Name,'x')")]);
    expect(builder.getCacheKeyParams()).toEqual({
      filter: { $raw: "(A eq 1 or B eq 2) and contains(Name,'x')" },
    });
  });

  test("clauses and raw live in one map side by side", () => {
    builder.filter([qPerson.name.eq("russell").and(new QFilterExpression("(A eq 1 or B eq 2)"))]);
    expect(builder.getCacheKeyParams()).toEqual({
      filter: { name: "russell", $raw: "(A eq 1 or B eq 2)" },
    });
  });

  test("the clause path is the OData name, not a mapped TypeScript name", () => {
    // the whole convergence claim rests on this: a derived relation produces OData names, so a
    // hand-written filter has to produce the same spelling or the two key separately
    builder.filter([new QStringPath("User_Name").eq("russell")]);
    expect(builder.getCacheKeyParams()).toEqual({ filter: { User_Name: "russell" } });
  });

  test("an empty filter expression contributes nothing", () => {
    builder.filter([new QFilterExpression()]);
    expect(builder.getCacheKeyParams()).toBeUndefined();
  });

  test("expanding() still renders exactly the same $expand content as before - tracking the structured entry alongside it changes nothing observable", () => {
    builder.expanding(createExpandingQueryBuilderV4, "friends", (nested: any) => {
      nested.filter(qPerson.friends.getEntity().name.equals("x"));
    });
    expect(builder.build()).toBe("Persons?%24expand=friends(%24filter%3Dname%20eq%20'x')");
  });

  test("a nav property reached through a complex property stays a bare, hoisted string - identically whether asked before or after build()", () => {
    builder.expanding(createExpandingQueryBuilderV4, "address", (nested: any) => {
      nested.expanding("responsible", () => {});
    });
    const before = builder.getCacheKeyParams();
    builder.build();
    const after = builder.getCacheKeyParams();

    expect(before).toEqual({ select: ["Address"], expand: ["Address/responsible"] });
    expect(after).toEqual(before);
  });

  describe("getCacheKeyParams: expand enrichment", () => {
    test("expand() enriches with the property's own name and kind, read directly off the Q-object - no table, no type", () => {
      builder.expand(["friends"]);
      expect(builder.getCacheKeyParams()).toEqual({ expand: [["friends", "list"]] });
    });

    test("a to-one navigation property enriches with kind 'detail'", () => {
      builder.expand(["bestFriend"]);
      expect(builder.getCacheKeyParams()).toEqual({ expand: [["bestFriend", "detail"]] });
    });

    test("addExpands() never enriches - it takes a raw path string, never a Q-object property, so there is no kind to read", () => {
      // "friends" happens to be both the property name and the rendered path in this fixture, but
      // addExpands() has no way to know that - it stays bare regardless of a coincidental string match
      builder.addExpands("friends");
      expect(builder.getCacheKeyParams()).toEqual({ expand: ["friends"] });
    });

    test("a bare (unenriched) path stays a string, mixed with hop entries", () => {
      builder.expand(["friends"]);
      builder.addExpands("address");
      expect(builder.getCacheKeyParams()).toEqual({
        expand: ["address", ["friends", "list"]],
      });
    });

    test("sorting mixes bare paths and hop entries by path, order carries no meaning", () => {
      builder.expand(["friends", "bestFriend"]);
      expect(builder.getCacheKeyParams()).toEqual({
        expand: [
          ["bestFriend", "detail"],
          ["friends", "list"],
        ],
      });
    });

    test("a nested expanding() carries its own nested params as the hop's 3rd element", () => {
      builder.expanding(createExpandingQueryBuilderV4, "friends", (nested: any, qFriend: any) => {
        nested.filter(qFriend.name.equals("x"));
      });
      expect(builder.getCacheKeyParams()).toEqual({
        expand: [["friends", "list", { filter: { name: "x" } }]],
      });
    });

    test("a nested expanding() with nothing to report contributes no 3rd element", () => {
      builder.expanding(createExpandingQueryBuilderV4, "friends", () => {});
      expect(builder.getCacheKeyParams()).toEqual({ expand: [["friends", "list"]] });
    });

    test("a nested expanding() resolves its own further nested expands the same way - no shared table needed at any depth", () => {
      builder.expanding(createExpandingQueryBuilderV4, "friends", (nested: any) => {
        nested.expanding("bestFriend", () => {});
      });
      expect(builder.getCacheKeyParams()).toEqual({
        expand: [["friends", "list", { expand: [["bestFriend", "detail"]] }]],
      });
    });
  });
});
