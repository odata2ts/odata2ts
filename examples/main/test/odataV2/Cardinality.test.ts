import { CollectionQueryBuilderV2, ModelQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { describe, expect, test } from "vitest";
import { QProduct } from "../../src-generated/odataV2/QODataDemo";
import { ODataDemoService } from "../../src-generated/odataV2/ODataDemoService";
import { MockODataClient } from "../MockODataClient";

/**
 * Integration test for the query builder's cardinality split (Model vs. Collection), run against the
 * actually generated V2 client - not a hand-written fixture - to prove the generator wires
 * single-entity vs. collection services to the correct builder type.
 *
 * Unlike V4, the *nested* builder passed into expanding() is not itself split by cardinality (V2's
 * $expand syntax cannot carry nested query options at all) - see test/trippin/Cardinality.test.ts for
 * that V4-only case. But expanding() itself - V2's substitute for deep selects - must remain available
 * on both cardinalities of the *outer* builder, since a deep select is meaningful regardless of whether
 * you're querying a single entity or a collection. That's what's verified below.
 */
describe("Unit Tests for V2 OData Demo Service: Query Builder Cardinality", function () {
  const BASE_URL = "test";
  const odataClient = new MockODataClient(true);
  const testService = new ODataDemoService(odataClient, BASE_URL, { noUrlEncoding: true });

  test("single entity: filter/top/skip/count/orderBy are not available", () => {
    testService.products(123).query((b, q) => {
      // @ts-expect-error: filter is not available for a single entity
      b.filter(q.name.eq("test"));
      // @ts-expect-error: top is not available for a single entity
      b.top(1);
      // @ts-expect-error: skip is not available for a single entity
      b.skip(1);
      // @ts-expect-error: count is not available for a single entity
      b.count();
      // @ts-expect-error: orderBy is not available for a single entity
      b.orderBy(q.name.asc());
    });
  });

  test("collection-level query still allows filter/top (sanity check)", async () => {
    await testService
      .products()
      .query((builder, qProduct) => builder.filter(qProduct.name.eq("test")).top(1))
      .execute();

    expect(odataClient.lastUrl).toBe("test/Products?$filter=Name eq 'test'&$top=1");
  });

  test("single entity: query() builder is a ModelQueryBuilderV2, and expanding (deep-select emulation) still works", async () => {
    await testService
      .products(123)
      .query((b) => {
        // type check: the builder passed into a single-entity service's query() is a ModelQueryBuilderV2
        const typeCheck: ModelQueryBuilderV2<QProduct> = b;
        return typeCheck.expanding("category", (catBuilder) => catBuilder.select("name"));
      })
      .execute();

    expect(odataClient.lastUrl).toBe("test/Products(123)?$select=Category/Name&$expand=Category");
  });

  test("collection: query() builder is a CollectionQueryBuilderV2, and expanding combines with filter/top", async () => {
    await testService
      .products()
      .query((b, q) => {
        // type check: the builder passed into a collection service's query() is a CollectionQueryBuilderV2
        const typeCheck: CollectionQueryBuilderV2<QProduct> = b;
        return typeCheck
          .expanding("category", (catBuilder) => catBuilder.select("name"))
          .filter(q.name.eq("test"))
          .top(1);
      })
      .execute();

    expect(odataClient.lastUrl).toBe(
      "test/Products?$select=Category/Name&$expand=Category&$filter=Name eq 'test'&$top=1",
    );
  });
});
