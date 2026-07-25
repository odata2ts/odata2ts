import { BigNumber } from "bignumber.js";
import { describe, expect, test } from "vitest";
import { EditableProductModel } from "../../src-generated/odataV2/ODataDemoModel.js";
import { ODataDemoService } from "../../src-generated/odataV2/ODataDemoService.js";
import { MockODataClient } from "../MockODataClient.js";

/**
 * The OData-Version header addresses the difference between OData 4.0 and 4.01 and is therefore only
 * relevant for V4 services. V2 must never declare it.
 */
describe("Testing OData version header of ODataDemoService (V2)", () => {
  const odataClient = new MockODataClient(true);
  const testService = new ODataDemoService(odataClient, "test", { noUrlEncoding: true });

  const model: EditableProductModel = {
    id: 123,
    name: "test",
    price: new BigNumber("12.03"),
    rating: 5,
    releaseDate: "xyz",
    description: "Description",
    discontinuedDate: null,
  };

  test("no version is declared when creating", async () => {
    await testService.products().create(model).execute();

    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.additionalHeaders?.["OData-Version"]).toBeUndefined();
  });

  test("no version is declared when patching", async () => {
    await testService.products(123).patch({ name: "changed" }).execute();

    expect(odataClient.additionalHeaders?.["OData-Version"]).toBeUndefined();
  });
});
