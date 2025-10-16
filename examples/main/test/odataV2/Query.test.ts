import type { HttpResponseModel } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV2, ODataEntityModelResponseV2 } from "@odata2ts/odata-core";
import { describe, expect, test } from "vitest";
import { ProductModel } from "../../src-generated/odataV2/ODataDemoModel";
import { ODataDemoService } from "../../src-generated/odataV2/ODataDemoService";
import { MockODataClient } from "../MockODataClient";

describe("Unit Tests for V2 OData Demo Service", function () {
  const BASE_URL = "test";
  const odataClient = new MockODataClient(true);
  const testService = new ODataDemoService(odataClient, BASE_URL, { noUrlEncoding: true });

  test("get by id", async () => {
    const result: HttpResponseModel<ODataEntityModelResponseV2<ProductModel>> = await testService.products(123).query();

    expect(odataClient.lastUrl).toBe("test/Products(123)");
    expect(result.status).toBe(200);
    expect(odataClient.additionalHeaders).toStrictEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
  });

  test("proper query", async () => {
    const result: HttpResponseModel<ODataCollectionResponseV2<ProductModel>> = await testService
      .products()
      .query((builder, qProduct) => builder.select("id", "name").filter(qProduct.price.plus("1").gt("1000")));

    expect(result.status).toBe(200);
    expect(odataClient.lastUrl).toBe("test/Products?$select=ID,Name&$filter=Price add 1 gt 1000");
    expect(odataClient.additionalHeaders).toStrictEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
  });
});
