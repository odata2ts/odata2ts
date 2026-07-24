import { describe, expect, test } from "vitest";
import { ODataDemoService } from "../../src-generated/odataV2/ODataDemoService.js";
import { MockODataClient } from "../MockODataClient.js";

/**
 * Integration test for deep select on complex-typed properties in V2, run against the actually generated
 * V2 client - not a hand-written fixture. Unlike V4, V2 doesn't auto-inline complex types, so both `expand()`
 * (now widened to accept complex properties, e.g. Supplier.Address) and `expanding()` (V2's flattening
 * deep-select mechanism) must work correctly for a complex property, not just for navigation properties.
 */
describe("Unit Tests for V2 OData Demo Service: Deep Select for Complex Types", function () {
  const BASE_URL = "test";
  const odataClient = new MockODataClient(true);
  const testService = new ODataDemoService(odataClient, BASE_URL, { noUrlEncoding: true });

  test("expand: works for a complex prop (Supplier.address), not just navigation properties", async () => {
    await testService
      .suppliers(1)
      .query((b) => b.expand("address"))
      .execute();

    expect(odataClient.lastUrl).toBe("test/Suppliers(1)?$expand=Address");
  });

  test("expanding: deep select into a complex prop (Supplier.address)", async () => {
    await testService
      .suppliers(1)
      .query((b) => b.expanding("address", (addrBuilder) => addrBuilder.select("city")))
      .execute();

    expect(odataClient.lastUrl).toBe("test/Suppliers(1)?$select=Address/City&$expand=Address");
  });

  test("expanding: complex prop nested inside an entity nav prop (Product.supplier/address) flattens correctly", async () => {
    await testService
      .products(123)
      .query((b) =>
        b.expanding("supplier", (supplierBuilder) => {
          supplierBuilder.expanding("address", (addrBuilder) => {
            addrBuilder.select("city");
          });
        }),
      )
      .execute();

    expect(odataClient.lastUrl).toBe(
      "test/Products(123)?$select=Supplier/Address/City&$expand=Supplier,Supplier/Address",
    );
  });
});
