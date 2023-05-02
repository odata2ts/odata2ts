import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import jQuery from "jquery";
import { JSDOM } from "jsdom";

import { JQueryODataClient } from "../src";
import { JqMock } from "./JQueryMock";

describe("HTTP Communication Tests", function () {
  const BASE_URL = "https://services.odata.org/TripPinRESTierService/(S(xxxsujx4iqjss1vkeighyks5))";

  const $ = jQuery(new JSDOM().window) as unknown as JQueryStatic;
  const REAL_CLIENT = new JQueryODataClient($);
  const jqMock = new JqMock() as unknown as JQueryStatic;
  const MOCK_CLIENT = new JQueryODataClient(jqMock);

  test("Simple Get", async () => {
    const response = await REAL_CLIENT.get<ODataCollectionResponseV4<any>>(BASE_URL + "/");
    expect(response.data?.value[0]).toStrictEqual({
      name: "People",
      kind: "EntitySet",
      url: "People",
    });
    expect(response.headers).toMatchObject({
      "content-type": "application/json; odata.metadata=minimal",
    });
  });

  test("PATCH request", async () => {
    const response = await REAL_CLIENT.patch<void>(BASE_URL + "/People('russellwhyte')", {
      MiddleName: "kk",
    });
    expect(response.data).toBeUndefined();
  });

  test("POST, PUT and DELETE request", async () => {
    const id = "heineritis";
    await REAL_CLIENT.post<ODataModelResponseV4<any>>(BASE_URL + "/People", {
      UserName: id,
      FirstName: "Heiner",
      LastName: "Itis",
    });

    await REAL_CLIENT.put<void>(BASE_URL + "/People('heineritis')", {
      FirstName: "Horst",
      LastName: "Itis",
    });

    await REAL_CLIENT.delete(BASE_URL + "/People('heineritis')");
  });
});
