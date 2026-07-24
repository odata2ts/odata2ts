import { describe, expect, test } from "vitest";
import { BASE_URL, ODATA_CLIENT, TRIPPIN } from "./TrippinTestConstants.js";

/**
 * Integration test for the query builder's cardinality split (Model vs. Collection), run against the
 * actually generated Trippin client - not a hand-written fixture - to prove the generator wires
 * single-entity vs. collection services to the correct builder type.
 */
describe("Trippin: Query Builder Cardinality", function () {
  test("single entity: filter/top/skip/count/orderBy/groupBy are not available", () => {
    TRIPPIN.people("tester").query((b, q) => {
      // @ts-expect-error: filter is not available for a single entity
      b.filter(q.age.gt(18));
      // @ts-expect-error: top is not available for a single entity
      b.top(1);
      // @ts-expect-error: skip is not available for a single entity
      b.skip(1);
      // @ts-expect-error: count is not available for a single entity
      b.count();
      // @ts-expect-error: orderBy is not available for a single entity
      b.orderBy(q.age.asc());
      // @ts-expect-error: groupBy is not available for a single entity
      b.groupBy("age");
    });
  });

  test("expanding a to-one nav prop (bestFriend) narrows the nested builder to model ops", () => {
    TRIPPIN.people().query((b) => {
      b.expanding("bestFriend", (nested, qNested) => {
        nested.select("age").expand("bestFriend");

        // @ts-expect-error: filter is not available for a to-one expanded model
        nested.filter(qNested.age.gt(18));
        // @ts-expect-error: top is not available for a to-one expanded model
        nested.top(1);
      });
    });
  });

  test("expanding a to-many nav prop (friends) keeps the nested builder at full (collection) ops", async () => {
    await TRIPPIN.people()
      .query((b, q) => {
        return b.expanding("friends", (nested, qFriend) => {
          nested.select("age").filter(qFriend.age.gt(18)).top(1);
        });
      })
      .execute();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People?$expand=Friends($select=Age;$filter=Age gt 18;$top=1)`);
  });

  test("collection-level query still allows filter/top (sanity check)", async () => {
    await TRIPPIN.people()
      .query((b, q) => b.filter(q.age.gt(18)).top(1))
      .execute();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People?$filter=Age gt 18&$top=1`);
  });
});
