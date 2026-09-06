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

    test("a nested expanding()'s own filter/select/orderBy never surfaces in the hop's 3rd element - only further expand hops do", () => {
      builder.expanding(createExpandingQueryBuilderV4, "friends", (nested: any, qFriend: any) => {
        nested.filter(qFriend.name.equals("x"));
      });
      expect(builder.getCacheKeyParams()).toEqual({
        expand: [["friends", "list"]],
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

  describe("getCacheKeyParams: filter/search canonicalization", () => {
    test("a single filter clause stays bare - no parens added where there is nothing to disambiguate", () => {
      builder.filter([qPerson.name.eq("Heinz")]);
      expect(builder.getCacheKeyParams()).toEqual({ filter: "name eq 'Heinz'" });
    });

    test("a single search term stays bare", () => {
      builder.search(["testing"]);
      expect(builder.getCacheKeyParams()).toEqual({ search: "testing" });
    });

    test("two filter clauses converge regardless of call-site order - sorted and grouped", () => {
      const inOneOrder = new ODataQueryBuilder<QPerson>("Persons", qPerson);
      inOneOrder.filter([qPerson.name.eq("Heinz")]);
      inOneOrder.filter([qPerson.age.eq(8)]);

      const inTheOtherOrder = new ODataQueryBuilder<QPerson>("Persons", qPerson);
      inTheOtherOrder.filter([qPerson.age.eq(8)]);
      inTheOtherOrder.filter([qPerson.name.eq("Heinz")]);

      expect(inOneOrder.getCacheKeyParams()?.filter).toBe(inTheOtherOrder.getCacheKeyParams()?.filter);
      expect(inOneOrder.getCacheKeyParams()).toEqual({ filter: "(age eq 8) and (name eq 'Heinz')" });
    });

    test("build() itself is unaffected by cache-key canonicalization - the real request keeps call-site order, ungrouped", () => {
      builder.filter([qPerson.name.eq("Heinz")]);
      builder.filter([qPerson.age.eq(8)]);
      expect(builder.build()).toBe("Persons?%24filter=name%20eq%20'Heinz'%20and%20age%20eq%208");
    });

    test("grouping is what makes convergence safe: an ungrouped 'or' clause would otherwise change meaning depending on which neighbor sorting puts next to it", () => {
      const inOneOrder = new ODataQueryBuilder<QPerson>("Persons", qPerson);
      inOneOrder.filter([qPerson.age.eq(8)]);
      inOneOrder.filter([qPerson.name.eq("Heinz").or(qPerson.name.eq("Karl"))]);

      const inTheOtherOrder = new ODataQueryBuilder<QPerson>("Persons", qPerson);
      inTheOtherOrder.filter([qPerson.name.eq("Heinz").or(qPerson.name.eq("Karl"))]);
      inTheOtherOrder.filter([qPerson.age.eq(8)]);

      expect(inOneOrder.getCacheKeyParams()?.filter).toBe(inTheOtherOrder.getCacheKeyParams()?.filter);
      expect(inOneOrder.getCacheKeyParams()).toEqual({
        filter: "(age eq 8) and (name eq 'Heinz' or name eq 'Karl')",
      });
    });

    test("search clauses converge regardless of call-site order - sorted, no grouping needed", () => {
      const inOneOrder = new ODataQueryBuilder<QPerson>("Persons", qPerson);
      inOneOrder.search(["zeta"]);
      inOneOrder.search(["alpha"]);

      const inTheOtherOrder = new ODataQueryBuilder<QPerson>("Persons", qPerson);
      inTheOtherOrder.search(["alpha"]);
      inTheOtherOrder.search(["zeta"]);

      expect(inOneOrder.getCacheKeyParams()?.search).toBe(inTheOtherOrder.getCacheKeyParams()?.search);
      expect(inOneOrder.getCacheKeyParams()).toEqual({ search: "alpha AND zeta" });
    });

    test("an $orderBy is never part of getCacheKeyParams() - its own sequence is real, result-changing content, not identity noise to canonicalize", () => {
      builder.orderBy([qPerson.age.desc()]);
      expect(builder.getCacheKeyParams()).toBeUndefined();
    });
  });
});
