import { TestODataClient } from "../../TestODataClient";
import { ODataDemoService } from "../../../build/v2/odata/ODataDemoService";
import { ProductModel, EditableProductModel } from "../../../build/v2/odata/ODataDemoModel";
import { AxiosError } from "axios";

/**
 * This sample service is a little buggy:
 * - with session ID querying for an unknown entity => 500 instead of 404
 * - Result type is different depending on count mode => without count data.d holds the collection instead of data.d.results
 */
describe("Integration Testing of generated stuff for Sample V2 OData Service", () => {
  const BASE_URL = "https://services.odata.org/V2/OData/OData.svc";
  const BASE_URL_WITH_SESSION = "https://services.odata.org/V2/(S(1nrhmelh1szkxjo0y4qlmzwm))/OData/OData.svc";
  const odataClient = new TestODataClient({
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  });

  const testService = new ODataDemoService(odataClient, BASE_URL);

  const PRODUCT_ZERO: Omit<ProductModel, "Category" | "Supplier"> = {
    ID: 0,
    Name: "Bread",
    Description: "Whole grain bread",
    ReleaseDate: "/Date(694224000000)/",
    DiscontinuedDate: null,
    Rating: 4,
    Price: "2.5",
  };

  test("list products with count", async () => {
    const result = await testService.products.query((b) => b.count());
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.d).toBeDefined();
    expect(result.data.d).toMatchObject({ __count: "9" });

    expect(result.data.d.results).toBeDefined();
    expect(result.data.d.results.length).toBe(9);
    expect(result.data.d.results[0]).toMatchObject(PRODUCT_ZERO);
  });

  test("get product zero", async () => {
    const result = await testService.products.get(0).query();
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.d).toBeDefined();

    const product: ProductModel = result.data.d;
    expect(product).toMatchObject(PRODUCT_ZERO);
  });

  test("get unknown product", async () => {
    try {
      await testService.products.get(666).query();
      // we expect an error and no success
      expect(1).toBe(2);
    } catch (error) {
      expect((error as AxiosError).isAxiosError).toBeTruthy();
      expect((error as AxiosError).response?.status).toBe(404);
      expect((error as AxiosError).message).toBe("Request failed with status code 404");
    }
  });

  test("create, update and delete product", async () => {
    jest.setTimeout(15000);

    // we need a session id to modify stuff on the server
    const editableService = new ODataDemoService(odataClient, BASE_URL_WITH_SESSION);

    // given
    const product: EditableProductModel = {
      ID: 999,
      Description: "Test Description",
      Name: "TestName",
      Price: "12.88",
      Rating: 1,
      ReleaseDate: "2022-12-31T12:15:59",
    };

    // when creating the product
    let result = await editableService.products.create(product);
    // then return object matches our product
    expect(result.data.d).toMatchObject({ ...product, ReleaseDate: "/Date(1672488959000)/" });

    // given a service for the new product
    const productService = editableService.products.get(product.ID);
    // when updating the description, we expect no error
    await productService.patch({ Description: "Updated Desc" });

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
    const result = await testService.products.query((b, qProduct) => {
      b.count()
        .select("id", "name", qProduct.category.props.name)
        .select(qProduct.category.props.id) // just for the fun of it
        .expand("category") // expand is required because of the deep select
        .filter(qProduct.id.eq(0));
    });
    expect(result.status).toBe(200);
    expect(result.data.d.results).toBeDefined();

    const products: Array<Partial<ProductModel>> = result.data.d.results;
    expect(products[0]).toMatchObject({
      ID: 0,
      Name: "Bread",
      Category: {
        ID: 0,
        Name: "Food",
      },
    });
  });
});
