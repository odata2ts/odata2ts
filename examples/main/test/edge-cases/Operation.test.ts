import { describe, expect, test } from "vitest";
import { edgeCaseService } from "../../src-generated/specials/edge-cases/edgeCaseService";
import { MockODataClient } from "../MockODataClient";

/**
 * Integration test against the actual generator output for the difference between operations
 * bound to a single entity and operations bound to an entity collection (OData V4).
 *
 * The edge-cases model contains both cardinalities on the same schema:
 *  - `GetParam`   is bound to `Collection(SRV.UserParamType)` => collection-bound
 *  - `AssignUser` is bound to `SRV.WarehouseType`             => entity-bound
 */
describe("EdgeCases: Bound Operation Cardinality", () => {
  const BASE_URL = "/test";
  const odataClient = new MockODataClient();
  const service = new edgeCaseService(odataClient, BASE_URL, { noUrlEncoding: true });

  test("operation bound to an entity collection sits on the collection path (no key predicate)", async () => {
    await service.UserParam().GetParam().execute();

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/UserParam/SRV.GetParam()`);
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("operation bound to a single entity sits on the keyed entity path", async () => {
    await service.Warehouse("W1").AssignUser().execute();

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/Warehouse('W1')/SRV.AssignUser`);
    expect(odataClient.lastOperation).toBe("POST");
  });

  test("a collection-bound operation is not exposed on the single-entity service", () => {
    // GetParam is bound to Collection(UserParamType) => generated only onto the collection service,
    // never onto the entity(-by-key) service. Accessing it there must be a compile-time error.
    // @ts-expect-error
    service.UserParam("someKey").GetParam;
  });
});
