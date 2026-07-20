import { describe, expect, test } from "vitest";
import { createQueryBuilderV2, createQueryBuilderV4, ModelQueryBuilderV2, ModelQueryBuilderV4 } from "../src";
import { QPerson, qPerson } from "./fixture/types/QSimplePersonModel";

/**
 * Verifies the cardinality split of the query builder API: a builder bound to a single model
 * (EntityType or ComplexType instance) only allows select/expand/expanding, while a builder bound to
 * a collection of models allows the full set of system query options.
 */
describe("Query Builder Cardinality", () => {
  describe("V4", () => {
    test("model builder allows select/expand/expanding", () => {
      const modelBuilder: ModelQueryBuilderV4<QPerson> = createQueryBuilderV4("/Persons", qPerson);

      const candidate = modelBuilder
        .select("name", "age")
        .expand("friends")
        .expanding("bestFriend", (builder) => {
          builder.select("name");
        })
        .build();

      expect(candidate).toBe(
        `/Persons?${encodeURIComponent("$select")}=${encodeURIComponent("name,age")}&${encodeURIComponent(
          "$expand",
        )}=${encodeURIComponent("friends,bestFriend($select=name)")}`,
      );
    });

    test("model builder rejects filter/top/skip/count/orderBy/groupBy/search", () => {
      const modelBuilder: ModelQueryBuilderV4<QPerson> = createQueryBuilderV4("/Persons", qPerson);

      // @ts-expect-error: filter is not available for a single model
      modelBuilder.filter(qPerson.name.eq("Horst"));
      // @ts-expect-error: top is not available for a single model
      modelBuilder.top(1);
      // @ts-expect-error: skip is not available for a single model
      modelBuilder.skip(1);
      // @ts-expect-error: count is not available for a single model
      modelBuilder.count();
      // @ts-expect-error: orderBy is not available for a single model
      modelBuilder.orderBy(qPerson.name.asc());
      // @ts-expect-error: groupBy is not available for a single model
      modelBuilder.groupBy("name");
      // @ts-expect-error: search is not available for a single model
      modelBuilder.search("test");
    });

    test("expanding a to-one prop narrows the nested builder to model ops", () => {
      createQueryBuilderV4("/Persons", qPerson).expanding("bestFriend", (nested, qNested) => {
        nested.select("name").expand("friends");

        // @ts-expect-error: filter is not available for a to-one expanded model
        nested.filter(qNested.name.eq("Horst"));
        // @ts-expect-error: top is not available for a to-one expanded model
        nested.top(1);
        // @ts-expect-error: skip is not available for a to-one expanded model
        nested.skip(1);
        // @ts-expect-error: count is not available for a to-one expanded model
        nested.count();
        // @ts-expect-error: orderBy is not available for a to-one expanded model
        nested.orderBy(qNested.name.asc());
      });
    });

    test("expanding a to-many prop keeps the nested builder at full (collection) ops", () => {
      const candidate = createQueryBuilderV4("/Persons", qPerson, { unencoded: true })
        .expanding("friends", (nested, qFriend) => {
          nested.select("name").filter(qFriend.name.eq("Horst")).top(1).skip(0).count().orderBy(qFriend.name.asc());
        })
        .build();

      expect(candidate).toBe(
        "/Persons?$expand=friends($select=name;$filter=name eq 'Horst';$orderby=name asc;$count=true;$top=1;$skip=0)",
      );
    });

    test("expanding a to-one complex prop narrows the nested builder to model ops", () => {
      createQueryBuilderV4("/Persons", qPerson).expanding("address", (nested, qAddress) => {
        nested.select("street").expanding("responsible", (respNested) => {
          respNested.select("name");
        });

        // @ts-expect-error: filter is not available for a to-one expanded model, even a complex one
        nested.filter(qAddress.street.eq("Horststr."));
        // @ts-expect-error: top is not available for a to-one expanded model, even a complex one
        nested.top(1);
        // @ts-expect-error: skip is not available for a to-one expanded model, even a complex one
        nested.skip(1);
        // @ts-expect-error: count is not available for a to-one expanded model, even a complex one
        nested.count();
        // @ts-expect-error: orderBy is not available for a to-one expanded model, even a complex one
        nested.orderBy(qAddress.street.asc());
      });
    });

    test("expanding a to-many complex prop keeps the nested builder at full (collection) ops incl. search", () => {
      const candidate = createQueryBuilderV4("/Persons", qPerson, { unencoded: true })
        .expanding("altAddresses", (nested, qAddress) => {
          nested.select("street").filter(qAddress.street.eq("Horststr.")).top(1).skip(0).count().search("berlin");
        })
        .build();

      expect(candidate).toBe(
        "/Persons?$select=AltAdresses($select=street;$filter=street eq 'Horststr.';$count=true;$top=1;$skip=0;$search=berlin)",
      );
    });
  });

  describe("V2", () => {
    test("model builder allows select/expand/expanding, rejects filter/top/skip/count/orderBy", () => {
      const modelBuilder: ModelQueryBuilderV2<QPerson> = createQueryBuilderV2("/Persons", qPerson);

      modelBuilder.select("name", "age").expand("friends");

      // @ts-expect-error: filter is not available for a single model
      modelBuilder.filter(qPerson.name.eq("Horst"));
      // @ts-expect-error: top is not available for a single model
      modelBuilder.top(1);
      // @ts-expect-error: skip is not available for a single model
      modelBuilder.skip(1);
      // @ts-expect-error: count is not available for a single model
      modelBuilder.count();
      // @ts-expect-error: orderBy is not available for a single model
      modelBuilder.orderBy(qPerson.name.asc());
    });
  });
});
