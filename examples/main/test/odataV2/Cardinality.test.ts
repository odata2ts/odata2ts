import { describe, expect, test } from "vitest";
import { ODataDemoService } from "../../src-generated/odataV2/ODataDemoService";
import { MockODataClient } from "../MockODataClient";

/**
 * Integration test for the query builder's cardinality split (Model vs. Collection), run against the
 * actually generated V2 client - not a hand-written fixture - to prove the generator wires
 * single-entity vs. collection services to the correct builder type.
 *
 * Unlike V4, V2's expanding() is not split by cardinality (its $expand syntax cannot carry nested
 * query options at all), so there is no nested-builder test here - see test/trippin/Cardinality.test.ts
 * for that V4-only case.
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
});
