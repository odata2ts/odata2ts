import { describe, expect, test } from "@jest/globals";
import { AxiosClient } from "@odata2ts/http-client-axios";
import { BigNumber } from "bignumber.js";

import { EditableProductModel, ProductModel } from "../build/odata/ODataDemoModel";
import { ODataDemoService } from "../build/odata/ODataDemoService";

/**
 * This sample service is buggy:
 * - with session ID querying for an unknown entity => 500 instead of 404
 * - Result type is different depending on count mode => without count data.d holds the collection instead of data.d.results
 * - Posting date type in ISO Date form => should be "/Date(...)/"
 */
describe("CRUD Integration Tests for OData Demo V2", () => {
  // we need a session id to modify stuff on the server
  const BASE_URL_WITH_SESSION = "https://services.odata.org/(S(rbtb0hnwoj1obdnxkwhnulwz))/V2/OData/OData.svc";
  const odataClient = new AxiosClient();

  const testService = new ODataDemoService(odataClient, BASE_URL_WITH_SESSION);

  const NEW_PRODUCT_2_ID = 777;
  const NEW_PRODUCT_REQUEST: EditableProductModel = {
    id: 884,
    name: "TestName",
    description: "Test Description",
    releaseDate: "2022-12-31T12:15:59", //WTF?! => this should be "/Date(...)"
    rating: 1,
    price: new BigNumber("12.88"),
  };
  const NEW_PRODUCT_RESPONSE = {
    ...NEW_PRODUCT_REQUEST,
    releaseDate: "/Date(1672488959000)/",
  };
  const productService = testService.products(NEW_PRODUCT_REQUEST.id);
  const product2Service = testService.products(NEW_PRODUCT_2_ID);

  describe("create new product", () => {
    test("create product", async () => {
      try {
        await productService.delete();
      } catch (e) {}

      // when creating the product
      const createResponse = await testService.products().create(NEW_PRODUCT_REQUEST);
      // then return object matches our product
      expect(createResponse.status).toBe(201);
      expect(createResponse.data.d).toMatchObject(NEW_PRODUCT_RESPONSE);
      expect(createResponse.headers).toMatchObject({ location: productService.getPath() });
    });

    test("create 2nd product", async () => {
      try {
        await product2Service.delete();
      } catch (e) {}

      const createResponse = await testService.products().create({ ...NEW_PRODUCT_REQUEST, id: NEW_PRODUCT_2_ID });
      // then return object matches our product
      expect(createResponse.status).toBe(201);
    });
  });

  describe("modify product", () => {
    /*  test("update product", async () => {
      const {} = NEW_PRODUCT_REQUEST;
      const response = await productService.update({ description: "Updated Desc" });
      expect(response.status).toBe(204);
      expect(response.data).toBeUndefined();
    });
*/
    test("patch product", async () => {
      // given a service for the new product
      // when updating the description, we expect no error
      const response = await product2Service.patch({ description: "Updated Desc" });
      expect(response.status).toBe(204);
      expect(response.data).toBeFalsy();
    });

    test("update primitive prop", async () => {
      const newValue = "Updated by Primitive Prop";
      const result = await product2Service.name().updateValue(newValue);

      expect(result.status).toBe(204);
      expect(result.data).toBeFalsy();
    });

    test("update primitive prop with converter", async () => {
      const newValue = new BigNumber("0.01234567890123456789");
      const result = await product2Service.price().updateValue(newValue);

      expect(result.status).toBe(204);
      expect(result.data).toBeFalsy();

      const response = await product2Service.price().getValue();
      expect(response.data?.d).toStrictEqual({ price: newValue });
    });
  });

  describe("delete product", () => {
    test("delete product", async () => {
      const response = await productService.delete();
      expect(response.status).toBe(204);
      expect(response.data).toBeFalsy();

      await product2Service.delete();
    });
  });
});
