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
});
