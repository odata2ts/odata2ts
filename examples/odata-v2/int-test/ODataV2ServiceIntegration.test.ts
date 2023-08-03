import { AxiosClient, AxiosClientError } from "@odata2ts/http-client-axios";
import { AxiosError } from "axios";

import { EditableProductModel, ProductModel } from "../build/odata/ODataDemoModel";
import { ODataDemoService } from "../build/odata/ODataDemoService";

/**
 * This sample service is buggy:
 * - with session ID querying for an unknown entity => 500 instead of 404
 * - Result type is different depending on count mode => without count data.d holds the collection instead of data.d.results
 * - Posting date type in ISO Date form => should be "/Date(...)/"
 */
describe("Integration Testing of generated stuff for Sample V2 OData Service", () => {
  const BASE_URL = "https://services.odata.org/V2/OData/OData.svc";
  const BASE_URL_WITH_SESSION = "https://services.odata.org/V2/(S(rbtb0hnwoj1obdnxkwhnulwz))/OData/OData.svc";
  const odataClient = new AxiosClient();

  const testService = new ODataDemoService(odataClient, BASE_URL);

  const PRODUCT_ZERO: Omit<ProductModel, "category" | "supplier"> = {
    id: 0,
    name: "Bread",
    description: "Whole grain bread",
    releaseDate: "/Date(694224000000)/",
    discontinuedDate: null,
    rating: 4,
    price: "2.5",
  };

  test("list products with count", async () => {
    const result = await testService.products().query((b) => b.count());
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.d).toBeDefined();
    expect(result.data.d).toMatchObject({ __count: "9" });

    expect(result.data.d.results).toBeDefined();
    expect(result.data.d.results.length).toBe(9);
    expect(result.data.d.results[0]).toMatchObject(PRODUCT_ZERO);
  });

  test("get product zero", async () => {
    const result = await testService.products(0).query();
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.d).toBeDefined();

    const product: ProductModel = result.data.d;
    expect(product).toMatchObject(PRODUCT_ZERO);
  });

  test("get unknown product", async () => {
    const axiosFailMsg = "Resource not found for the segment 'Products'.";
    const axiosClientMsgPrefix = "OData server responded with error: ";
    await expect(() => testService.products(666).query()).rejects.toThrow(axiosClientMsgPrefix + axiosFailMsg);

    // again, but now inspect error in detail
    try {
      await testService.products(666).query();
      // we expect an error and no success
      expect(1).toBe(2);
    } catch (error) {
      const e = error as AxiosClientError;
      expect(e.name).toBe("AxiosClientError");
      expect(e.message).toBe(axiosClientMsgPrefix + axiosFailMsg);
      expect(e.cause).toBeDefined();
      expect(e.status).toBe(404);
      expect(e.axiosError?.response).toBeDefined();
      expect(e.axiosError?.response?.status).toBe(404);
      expect(e.axiosError?.response?.data).toStrictEqual({
        error: {
          code: "",
          message: { lang: "en-US", value: axiosFailMsg },
        },
      });
    }
  });

  test("create, update and delete product", async () => {
    jest.setTimeout(15000);

    // given
    const product: EditableProductModel = {
      id: 884,
      description: "Test Description",
      name: "TestName",
      price: "12.88",
      rating: 1,
      releaseDate: "2022-12-31T12:15:59", //WTF?! => this should be "/Date(...)"
    };

    // we need a session id to modify stuff on the server
    const editableService = new ODataDemoService(odataClient, BASE_URL_WITH_SESSION);
    const productService = editableService.products(product.id);

    try {
      await productService.delete();
    } catch (e) {}

    // when creating the product
    let result = await editableService.products().create(product);
    // then return object matches our product
    expect(result.data.d).toMatchObject({ ...product, releaseDate: "/Date(1672488959000)/" });

    // given a service for the new product
    // when updating the description, we expect no error
    await productService.patch({ description: "Updated Desc" });

    // when deleting this new product, we expect no error
    await new Promise((res) => setTimeout(res, 1000));
    await productService.delete();
  });

  test("function call", async () => {
    const result = await testService.getProductsByRating({ rating: 4 });

    expect(result.status).toBe(200);
    // no count query => no "results" object (bug in odata-service)
    // @ts-ignore
    expect(result.data.d[0]).toMatchObject(PRODUCT_ZERO);
  });

  test("deep select query", async () => {
    const result = await testService.products().query((b, qProduct) => {
      b.count()
        .select("id", "name")
        .expanding("category", (expBuilder) => {
          expBuilder.select("name", "id");
        })
        .filter(qProduct.id.eq(0));
    });
    expect(result.status).toBe(200);
    expect(result.data.d.results).toBeDefined();

    const products: Array<Partial<ProductModel>> = result.data.d.results;
    expect(products[0]).toMatchObject({
      id: 0,
      name: "Bread",
      category: {
        id: 0,
        name: "Food",
      },
    });
  });

  test("create key and parse key", async () => {
    const expectedSimple = 333;
    const expectedComplex = { id: expectedSimple };

    // simple version
    let result = testService.products().createKey(expectedSimple);
    expect(result).toBe(`Products(${expectedSimple})`);
    expect(testService.products().parseKey(result)).toBe(expectedSimple);

    // complex version
    result = testService.products().createKey(expectedComplex);
    expect(result).toBe(`Products(ID=${expectedSimple})`);
    expect(testService.products().parseKey(result)).toStrictEqual(expectedComplex);
  });
});
