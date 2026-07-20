import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import {
  EditableLocationModel,
  EditablePersonModel,
  FeatureModel,
  PersonGenderModel,
  PersonModel,
} from "../../src-generated/trippin/TrippinModel";
import { BASE_URL, ODATA_CLIENT, TRIPPIN } from "./TrippinTestConstants";

describe("Testing Generation of TrippinService", () => {
  const userModel: EditablePersonModel = {
    traditionalGenderCategories: PersonGenderModel.Unknown,
    user: "williams",
    age: 66,
    favoriteFeature: FeatureModel.Feature1,
    features: [],
    firstName: "Heinz",
  };
  const odataModel = {
    UserName: "williams",
    FavoriteFeature: "Feature1",
    Features: [],
    FirstName: "Heinz",
    Age: 66,
    Gender: "Unknown",
  };

  test("entitySet: create", async () => {
    const expectedUrl = `${BASE_URL}/People`;

    ODATA_CLIENT.setModelResponse(odataModel);
    const response = await TRIPPIN.people().create(userModel).execute();

    expect(ODATA_CLIENT.lastOperation).toBe("POST");
    expect(ODATA_CLIENT.lastUrl).toBe(expectedUrl);
    expect(ODATA_CLIENT.lastData).toStrictEqual(odataModel);

    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<PersonModel>>>();
    expect(response.data).toStrictEqual(userModel);
  });

  test("entityType: update", async () => {
    const id = userModel.user;
    const expectedUrl = `${BASE_URL}/People('${id}')`;

    const response = await TRIPPIN.people(id).update(userModel).execute();

    expect(ODATA_CLIENT.lastOperation).toBe("PUT");
    expect(ODATA_CLIENT.lastUrl).toBe(expectedUrl);
    expect(ODATA_CLIENT.lastData).toStrictEqual(odataModel);

    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<undefined>>();
  });

  test("entitySet: create with select/expand", async () => {
    const expectedUrl = `${BASE_URL}/People?$select=FirstName`;

    ODATA_CLIENT.setModelResponse(odataModel);
    const response = await TRIPPIN.people()
      .create(userModel, undefined, (b) => b.select("firstName"))
      .execute();

    expect(ODATA_CLIENT.lastOperation).toBe("POST");
    expect(ODATA_CLIENT.lastUrl).toBe(expectedUrl);
    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<PersonModel>>>();
  });

  test("entityType: update with select/expand", async () => {
    const id = userModel.user;
    const expectedUrl = `${BASE_URL}/People('${id}')?$expand=BestFriend`;

    const response = await TRIPPIN.people(id)
      .update(userModel, undefined, (b) => b.expand("bestFriend"))
      .execute();

    expect(ODATA_CLIENT.lastOperation).toBe("PUT");
    expect(ODATA_CLIENT.lastUrl).toBe(expectedUrl);
    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<undefined>>();
  });

  test("entityType: update returns a builder-backed Cmd, addToQuery works", async () => {
    const id = userModel.user;
    const expectedUrl = `${BASE_URL}/People('${id}')?$select=FirstName`;

    await TRIPPIN.people(id)
      .update(userModel)
      .addToQuery((b) => b.select("firstName"))
      .execute();

    expect(ODATA_CLIENT.lastUrl).toBe(expectedUrl);
  });

  test("entityType: patch", async () => {
    const id = "williams";
    const expectedUrl = `${BASE_URL}/People('${id}')`;

    const response = await TRIPPIN.people(id).patch({ age: 30 }).execute();

    expect(ODATA_CLIENT.lastOperation).toBe("PATCH");
    expect(ODATA_CLIENT.lastUrl).toBe(expectedUrl);
    expect(ODATA_CLIENT.lastData).toStrictEqual({ Age: 30 });

    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<undefined>>();
  });

  test("entityType: delete", async () => {
    const id = "williams";
    const expectedUrl = `${BASE_URL}/People('${id}')`;

    const response = await TRIPPIN.people(id).delete().execute();

    expect(ODATA_CLIENT.lastOperation).toBe("DELETE");
    expect(ODATA_CLIENT.lastUrl).toBe(expectedUrl);
    expect(ODATA_CLIENT.lastData).toBe(undefined);

    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<undefined>>();
  });

  test("complex type: update", async () => {
    const complex = TRIPPIN.people("tester").homeAddress();

    const model: EditableLocationModel = {
      address: "Test Address",
      city: { name: "Test City" },
    };
    await complex.update(model).execute();

    expect(ODATA_CLIENT.lastOperation).toBe("PUT");
    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('tester')/HomeAddress`);
    expect(ODATA_CLIENT.lastData).toStrictEqual({
      Address: "Test Address",
      City: { Name: "Test City" },
    });
  });

  test("complex collection: create", async () => {
    const model: EditableLocationModel = { address: "TestAdress" };
    await TRIPPIN.people("tester").addressInfo().add(model).execute();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(ODATA_CLIENT.lastOperation).toBe("POST");
    expect(ODATA_CLIENT.lastData).toStrictEqual({ Address: "TestAdress" });
  });

  test("complex collection: create with select/expand", async () => {
    const model: EditableLocationModel = { address: "TestAdress" };
    await TRIPPIN.people("tester")
      .addressInfo()
      .add(model, (b) => b.select("address"))
      .execute();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo?$select=Address`);
    expect(ODATA_CLIENT.lastOperation).toBe("POST");
    expect(ODATA_CLIENT.lastData).toStrictEqual({ Address: "TestAdress" });
  });

  test("complex collection: update", async () => {
    const models = [{ address: "TestAddress 1" }, { address: "test 2" }];
    await TRIPPIN.people("tester").addressInfo().update(models).execute();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(ODATA_CLIENT.lastOperation).toBe("PUT");
    expect(ODATA_CLIENT.lastData).toStrictEqual([{ Address: "TestAddress 1" }, { Address: "test 2" }]);
  });

  test("complex collection: delete", async () => {
    await TRIPPIN.people("tester").addressInfo().delete().execute();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(ODATA_CLIENT.lastOperation).toBe("DELETE");
    expect(ODATA_CLIENT.lastData).toBeUndefined();
  });
});
