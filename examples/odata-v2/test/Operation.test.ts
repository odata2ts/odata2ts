import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2 } from "@odata2ts/odata-core";

import { ProductModel } from "../build/odata/ODataDemoModel";
import { ODataDemoService } from "../build/odata/ODataDemoService";
import { MockClient } from "./MockClient";

describe("V2 Operation (FunctionImport) Tests", function () {
  const BASE_URL = "test";
  const odataClient = new MockClient(true);
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
