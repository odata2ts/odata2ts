import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";

import { FetchODataClient, FetchODataClientError } from "../src";

describe("HTTP Communication Tests", function () {
  const BASE_URL = "https://services.odata.org/TripPinRESTierService/(S(xxxsujx4iqjss1vkeighyks5))";

  const REAL_CLIENT = new FetchODataClient();

  test("Simple Get", async () => {
    const url = BASE_URL + "/People('russellwhyte')";
    const response = await REAL_CLIENT.get<ODataCollectionResponseV4<any>>(url);
    expect(response).toMatchObject({
      status: 200,
      statusText: "OK",
      headers: {
        "cache-control": "no-cache",
        "content-type": "application/json; odata.metadata=minimal",
        "odata-version": "4.0",
        pragma: "no-cache",
      },
    });
    expect(response.data).toMatchObject({
      FirstName: "Russell",
      LastName: "Whyte",
      Emails: ["Russell@example.com", "Russell@contoso.com"],
    });
  });

  test("404", async () => {
    const expectedErrorMsg = "The request resource is not found.";
    const url = BASE_URL + "/People('NON_EXISTING')";
    try {
      await REAL_CLIENT.get<ODataCollectionResponseV4<any>>(url);
    } catch (e) {
      expect(e).toBeInstanceOf(FetchODataClientError);

      const error = e as FetchODataClientError;
      expect(error).toMatchObject({
        name: "FetchODataClientError",
        status: 404,
        message: `OData server responded with error: ${expectedErrorMsg}`,
      });
      expect(error.cause?.message).toBe(expectedErrorMsg);
      expect(error.stack).toMatch(expectedErrorMsg);
      expect(error.stack).toMatch(error.name);
    }
  });

  const entitySetUrl = BASE_URL + "/People";
  const id = "heineritis";
  const entityUrl = `${entitySetUrl}('${id}')`;
  const model = {
    UserName: id,
    FirstName: "Heiner",
    LastName: "Itis",
  };

  describe("Create Own Entity", function () {
    test("POST", async () => {
      // delete the entity we want to create => required if any test failed
      try {
        await REAL_CLIENT.delete(entityUrl);
      } catch (e) {
        //ignore
      }

      let response = await REAL_CLIENT.post<ODataModelResponseV4<any>>(entitySetUrl, model);

      expect(response).toMatchObject({
        status: 201,
        statusText: "Created",
        headers: {
          "cache-control": "no-cache",
          "content-type": "application/json; odata.metadata=minimal",
          location: entityUrl,
        },
      });
      expect(response.data).toMatchObject(model);
    });
  });

  describe("Manipulate Own Entity", function () {
    test("PUT", async () => {
      const newModel = {
        FirstName: "Horst",
        Age: 34,
      };
      let response = await REAL_CLIENT.put<void>(entityUrl, newModel);
      expect(response).toMatchObject({
        status: 204,
        statusText: "No Content",
        data: undefined,
      });

      response = await REAL_CLIENT.get(entityUrl);
      expect(response.data).toMatchObject(newModel);
    });

    test("PATCH", async () => {
      const response = await REAL_CLIENT.patch<void>(entityUrl, {
        MiddleName: "kk",
      });
      expect(response).toMatchObject({
        status: 204,
        statusText: "No Content",
        data: undefined,
      });

      const response2 = await REAL_CLIENT.get<ODataModelResponseV4<any>>(entityUrl);
      expect(response2.data.MiddleName).toBe("kk");
    });
  });

  describe("Delete Own Entity", function () {
    test("DELETE", async () => {
      const response = await REAL_CLIENT.delete(entityUrl);
      expect(response).toMatchObject({
        status: 204,
        statusText: "No Content",
        data: undefined,
      });
    });
  });
});
