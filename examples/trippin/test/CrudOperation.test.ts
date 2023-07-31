import {
  EditableLocationModel,
  EditablePersonModel,
  FeatureModel,
  PersonGenderModel,
} from "../build/trippin/TrippinModel";
import { BASE_URL, ODATA_CLIENT, TRIPPIN } from "./infra/TestConstants";

describe("Testing Generation of TrippinService", () => {
  let editModel: EditablePersonModel;

  beforeEach(() => {
    editModel = {
      traditionalGenderCategories: PersonGenderModel.Unknown,
      user: "williams",
      age: 66,
      favoriteFeature: FeatureModel.Feature1,
      features: [],
      firstName: "Heinz",
    };
  });

  test("entitySet: create", async () => {
    const expectedUrl = `${BASE_URL}/People`;

    await TRIPPIN.people().create(editModel);

    expect(ODATA_CLIENT.lastOperation).toBe("POST");
    expect(ODATA_CLIENT.lastUrl).toBe(expectedUrl);
    expect(ODATA_CLIENT.lastData).toStrictEqual({
      UserName: "williams",
      FavoriteFeature: "Feature1",
      Features: [],
      FirstName: "Heinz",
      Age: 66,
      Gender: "Unknown",
    });
  });

  test("entityType: update", async () => {
    const id = "williams";
    const expectedUrl = `${BASE_URL}/People('${id}')`;
    const model: EditablePersonModel = {
      user: "williams",
      firstName: "Heinz",
      age: 91,
      traditionalGenderCategories: PersonGenderModel.Unknown,
      favoriteFeature: FeatureModel.Feature1,
      features: [],
    };

    await TRIPPIN.people(id).update(model);

    expect(ODATA_CLIENT.lastOperation).toBe("PUT");
    expect(ODATA_CLIENT.lastUrl).toBe(expectedUrl);
    expect(ODATA_CLIENT.lastData).toStrictEqual({
      UserName: "williams",
      FirstName: "Heinz",
      Age: 91,
      Gender: "Unknown",
      FavoriteFeature: FeatureModel.Feature1,
      Features: [],
    });
  });

  test("entityType: patch", async () => {
    const id = "williams";
    const expectedUrl = `${BASE_URL}/People('${id}')`;
    const model = {
      age: 30,
    };

    await TRIPPIN.people(id).patch(model);

    expect(ODATA_CLIENT.lastOperation).toBe("PATCH");
    expect(ODATA_CLIENT.lastUrl).toBe(expectedUrl);
    expect(ODATA_CLIENT.lastData).toStrictEqual({ Age: 30 });
  });

  test("entityType: delete", async () => {
    const id = "williams";
    const expectedUrl = `${BASE_URL}/People('${id}')`;

    await TRIPPIN.people(id).delete();

    expect(ODATA_CLIENT.lastOperation).toBe("DELETE");
    expect(ODATA_CLIENT.lastUrl).toBe(expectedUrl);
    expect(ODATA_CLIENT.lastData).toBe(undefined);
  });

  test("complex type: update", async () => {
    const complex = TRIPPIN.people("tester").homeAddress();

    const model: EditableLocationModel = {
      address: "Test Address",
      city: { name: "Test City" },
    };
    await complex.update(model);

    expect(ODATA_CLIENT.lastOperation).toBe("PUT");
    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('tester')/HomeAddress`);
    expect(ODATA_CLIENT.lastData).toStrictEqual({
      Address: "Test Address",
      City: { Name: "Test City" },
    });
  });

  test("complex collection: create", async () => {
    const model: EditableLocationModel = { address: "TestAdress" };
    await TRIPPIN.people("tester").addressInfo().add(model);

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(ODATA_CLIENT.lastOperation).toBe("POST");
    expect(ODATA_CLIENT.lastData).toStrictEqual({ Address: "TestAdress" });
  });

  test("complex collection: update", async () => {
    const models = [{ address: "TestAddress 1" }, { address: "test 2" }];
    await TRIPPIN.people("tester").addressInfo().update(models);

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(ODATA_CLIENT.lastOperation).toBe("PUT");
    expect(ODATA_CLIENT.lastData).toStrictEqual([{ Address: "TestAddress 1" }, { Address: "test 2" }]);
  });

  test("complex collection: delete", async () => {
    await TRIPPIN.people("tester").addressInfo().delete();

    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(ODATA_CLIENT.lastOperation).toBe("DELETE");
    expect(ODATA_CLIENT.lastData).toBeUndefined();
  });
});
