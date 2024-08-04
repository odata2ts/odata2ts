import type { HttpResponseModel } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV2 } from "@odata2ts/odata-core";

import { ProductModel } from "../../build/odataV2/ODataDemoModel";
import { ODataDemoService } from "../../build/odataV2/ODataDemoService";
import { MockODataClient } from "../MockODataClient";

describe("V2 Operation (FunctionImport) Tests", function () {
  const BASE_URL = "test";
  const odataClient = new MockODataClient(true);
  const testService = new ODataDemoService(odataClient, BASE_URL);

  test("productsByRating", async () => {
    const result: HttpResponseModel<ODataCollectionResponseV2<ProductModel>> = await testService.getProductsByRating({
      rating: 5,
    });

    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastUrl).toBe("test/GetProductsByRating?rating=5");
    expect(result.status).toBe(200);
  });
});
