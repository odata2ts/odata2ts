import { describe, expect, test } from "vitest";
import { ODataDemoService } from "../../src-generated/odataV2/ODataDemoService";
import { MockODataClient } from "../MockODataClient";

/**
 * Integration test for the $select=* wildcard in V2, run against the actually generated V2 client - not a
 * hand-written fixture - to prove select("*") produces the literal wildcard and, nested inside expanding(),
 * flattens to prefix/* like any other deep-selected property.
 */
describe("Unit Tests for V2 OData Demo Service: Select Wildcard ($select=*)", function () {
  const BASE_URL = "test";
  const odataClient = new MockODataClient(true);
  const testService = new ODataDemoService(odataClient, BASE_URL, { noUrlEncoding: true });

  test('select("*") alone', async () => {
    await testService
      .products()
      .query((b) => b.select("*"))
      .execute();

    expect(odataClient.lastUrl).toBe("test/Products?$select=*");
  });

  test("expanding: wildcard select on a nav prop flattens to prefix/*", async () => {
    await testService
      .products(123)
      .query((b) => b.expanding("supplier", (supplierBuilder) => supplierBuilder.select("*")))
      .execute();

    expect(odataClient.lastUrl).toBe("test/Products(123)?$select=Supplier/*&$expand=Supplier");
  });
});
