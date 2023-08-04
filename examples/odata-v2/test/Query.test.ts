import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2, ODataModelResponseV2 } from "@odata2ts/odata-core";
import { BigNumber } from "bignumber.js";

import { ProductModel } from "../build/odata/ODataDemoModel";
import { ODataDemoService } from "../build/odata/ODataDemoService";
import { MockClient } from "./MockClient";

describe("Unit Tests for V2 OData Demo Service", function () {
  const BASE_URL = "test";
  const odataClient = new MockClient(true);
  const testService = new ODataDemoService(odataClient, BASE_URL);
  const ENC = encodeURIComponent;

  test("get by id", async () => {
    const result: HttpResponseModel<ODataModelResponseV2<ProductModel>> = await testService.products(123).query();

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

    expect(odataClient.lastUrl).toBe(
      `test/Products?%24select=${ENC("ID,Name")}&%24filter=${ENC("Price add 1 gt 1000")}`
    );
    expect(result.status).toBe(200);
    expect(odataClient.additionalHeaders).toStrictEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
  });
});
