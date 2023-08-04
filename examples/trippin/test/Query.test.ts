import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";

import { PersonIdModel, PersonModel } from "../build/trippin/TrippinModel";
import { BASE_URL, ODATA_CLIENT, TRIPPIN } from "./infra/TestConstants";

type SelectedPersonShape = Pick<PersonModel, "user" | "lastName" | "addressInfo">;

describe("Trippin: Testing Query Functionality", function () {
  test("entitySet", async () => {
    const expected = `${BASE_URL}/People`;

    const response: HttpResponseModel<ODataCollectionResponseV4<PersonModel>> = await TRIPPIN.people().query();

    expect(ODATA_CLIENT.lastUrl).toBe(expected);
    expect(ODATA_CLIENT.lastOperation).toBe("GET");
    expect(ODATA_CLIENT.lastData).toBeUndefined();
  });

  test("entitySet: get with complex id", async () => {
    const testId: PersonIdModel = { user: "williams" };
    const expected = `${BASE_URL}/People(UserName='williams')`;

    const response: HttpResponseModel<ODataModelResponseV4<PersonModel>> = await TRIPPIN.people(testId).query();

    expect(ODATA_CLIENT.lastUrl).toBe(expected);
    expect(ODATA_CLIENT.lastOperation).toBe("GET");
    expect(ODATA_CLIENT.lastData).toBeUndefined();
  });

  test("entitySet: query with select", async () => {
    const expected = `${BASE_URL}/People?%24select=UserName%2CLastName%2CAddressInfo`;

    // const response = await TRIPPIN.people().query((builder) => builder.select("user", "lastName", "addressInfo"));

    const response = await TRIPPIN.people().query((builder) => builder.select("user", "lastName", "addressInfo"));
    const dataType: Array<SelectedPersonShape> = response?.data?.value;

    expect(ODATA_CLIENT.lastUrl).toBe(expected);
  });

  test("complex type: query", async () => {
    await TRIPPIN.people("tester").homeAddress().query();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('tester')/HomeAddress`);
    expect(ODATA_CLIENT.lastOperation).toBe("GET");
    expect(ODATA_CLIENT.lastData).toBeUndefined();
  });

  test("complex collection: query", async () => {
    await TRIPPIN.people("tester").addressInfo().query();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(ODATA_CLIENT.lastOperation).toBe("GET");
    expect(ODATA_CLIENT.lastData).toBeUndefined();
  });

  test("primitive type: get value", async () => {
    await TRIPPIN.people("tester").age().getValue();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('tester')/Age`);
    expect(ODATA_CLIENT.lastOperation).toBe("GET");
    expect(ODATA_CLIENT.lastData).toBeUndefined();
  });
});
