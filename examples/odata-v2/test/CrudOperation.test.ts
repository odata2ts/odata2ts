import { BigNumber } from "bignumber.js";

import { EditableProductModel } from "../build/odata/ODataDemoModel";
import { ODataDemoService } from "../build/odata/ODataDemoService";
import { MockClient } from "./MockClient";

describe("V2 CRUD Functionality Tests", function () {
  const BASE_URL = "test";
  const odataClient = new MockClient(true);
  const testService = new ODataDemoService(odataClient, BASE_URL);

  test("create", () => {
    const model: EditableProductModel = {
      id: 123,
      name: "test",
      price: new BigNumber("12.03"),
      rating: 5,
      releaseDate: "xyz",
      description: "Description",
      discontinuedDate: null,
    };
    testService.products().create(model);

    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastUrl).toBe("test/Products");
    expect(odataClient.lastData).toStrictEqual({
      ID: 123,
      Name: "test",
      Price: "12.03",
      Rating: 5,
      ReleaseDate: "xyz",
      Description: "Description",
      DiscontinuedDate: null,
    });
    expect(odataClient.additionalHeaders).toStrictEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
  });

  test("update", () => {
    const model = {
      id: 123,
      name: "test",
      price: new BigNumber("12.03"),
      rating: 5,
      releaseDate: "xyz",
      discontinuedDate: null,
    };
    testService.products(123).update(model);

    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastUrl).toBe("test/Products(123)");
    expect(odataClient.lastData).toStrictEqual({
      ID: 123,
      Name: "test",
      Price: "12.03",
      Rating: 5,
      ReleaseDate: "xyz",
      DiscontinuedDate: null,
    });
    expect(odataClient.additionalHeaders).toStrictEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
  });

  test("patch => merge", () => {
    const model: Partial<EditableProductModel> = {
      description: "test",
    };
    testService.products(123).patch(model);

    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastUrl).toBe("test/Products(123)");
    expect(odataClient.lastData).toStrictEqual({
      Description: "test",
    });
    expect(odataClient.additionalHeaders).toMatchObject({
      "X-Http-Method": "MERGE",
      "Content-Type": "application/json",
    });
  });

  test("delete", () => {
    testService.products(123).delete();

    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastUrl).toBe("test/Products(123)");
    expect(odataClient.lastData).toStrictEqual(undefined);
  });
});
