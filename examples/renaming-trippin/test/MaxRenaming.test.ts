import { servicexxx_Trippin_xxxs } from "../generated-src/TRIPPIN/servicexxx_Trippin_xxxs";
import { lOCATION_QUERY_OBJECT, pERSON_QUERY_OBJECT } from "../generated-src/TRIPPIN/TRIPPIN_QUERY_OBJECTS";
import { EDITABLE_LOCATION, EDITABLE_PERSON, FEATURE, PERSON_ID } from "../generated-src/TRIPPIN/TRIPPIN_TYPES";
import { MockODataClient } from "./MockODataClient";

describe("Testing Generation With Max Renaming Options", () => {
  const BASE_URL = "/test";
  const odataClient = new MockODataClient();

  // noinspection JSPotentiallyInvalidConstructorUsage
  const testService = new servicexxx_Trippin_xxxs(odataClient, BASE_URL);

  let editModel: EDITABLE_PERSON;

  beforeEach(() => {
    editModel = {
      user_name: "williams",
      favorite_feature: FEATURE.Feature1,
      features: [],
      first_name: "Heinz",
    };
  });

  test("unbound function", async () => {
    await testService.get_person_with_most_friends_func();
    expect(odataClient.lastUrl).toBe(`${BASE_URL}/GetPersonWithMostFriends()`);
  });

  test("unbound function with params", async () => {
    await testService.get_nearest_airport_func({ lat: 123, lon: 345 });
    expect(odataClient.lastUrl).toBe(`${BASE_URL}/GetNearestAirport(lat=123,lon=345)`);
  });

  test("unbound action", async () => {
    await testService.reset_data_source_act();
    expect(odataClient.lastUrl).toBe(`${BASE_URL}/ResetDataSource`);
    expect(odataClient.lastData).toEqual({});
  });

  test("entitySet", async () => {
    const expected = `${BASE_URL}/People`;

    expect(testService.navigate_to_people().getPath()).toBe(expected);
    expect(JSON.stringify(testService.navigate_to_people().getQObject())).toEqual(JSON.stringify(pERSON_QUERY_OBJECT));
    expect(testService.navigate_to_people().getKeySpec().length).toBe(1);
    expect(testService.navigate_to_people().getKeySpec()[0].getName()).toEqual("UserName");
  });

  test("entitySet: create", async () => {
    const expectedUrl = `${BASE_URL}/People`;

    await testService.navigate_to_people().create(editModel);

    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastUrl).toBe(expectedUrl);
    expect(odataClient.lastData).toStrictEqual({
      UserName: "williams",
      FavoriteFeature: "Feature1",
      Features: [],
      FirstName: "Heinz",
    });
  });

  test("entitySet: get", async () => {
    const testId = "test";
    const expected = `${BASE_URL}/People('${testId}')`;

    const etService = testService.navigate_to_people(testId);

    expect(etService.getPath()).toBe(expected);
    expect(JSON.stringify(etService.getQObject())).toEqual(JSON.stringify(pERSON_QUERY_OBJECT));
  });

  test("entitySet: get with complex id", async () => {
    const testId: PERSON_ID = { user_name: "williams" };
    const expected = `${BASE_URL}/People(UserName='williams')`;

    expect(testService.navigate_to_people(testId).getPath()).toBe(expected);
  });

  test("entityType: update", async () => {
    const id = "williams";
    const expectedUrl = `${BASE_URL}/People('${id}')`;
    const model: EDITABLE_PERSON = {
      user_name: "williams",
      favorite_feature: FEATURE.Feature1,
      features: [],
      first_name: "Heinz",
      age: 33,
    };

    await testService.navigate_to_people(id).update(model);

    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastUrl).toBe(expectedUrl);
    expect(odataClient.lastData).toStrictEqual({
      UserName: "williams",
      FavoriteFeature: FEATURE.Feature1,
      Features: [],
      FirstName: "Heinz",
      Age: 33,
    });
  });

  test("entityType: patch", async () => {
    const id = "williams";
    const expectedUrl = `${BASE_URL}/People('${id}')`;
    const model = {
      age: 44,
    };

    await testService.navigate_to_people(id).patch(model);

    expect(odataClient.lastOperation).toBe("PATCH");
    expect(odataClient.lastUrl).toBe(expectedUrl);
    expect(odataClient.lastData).toStrictEqual({ Age: 44 });
  });

  test("entityType: delete", async () => {
    const id = "williams";
    const expectedUrl = `${BASE_URL}/People('${id}')`;

    await testService.navigate_to_people(id).delete();

    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastUrl).toBe(expectedUrl);
    expect(odataClient.lastData).toBe(undefined);
  });

  test("complex type", async () => {
    const complex = testService.navigate_to_people("tester").navigate_to_home_address();

    expect(complex.getPath()).toBe(`${BASE_URL}/People('tester')/HomeAddress`);
    expect(JSON.stringify(complex.getQObject())).toEqual(JSON.stringify(lOCATION_QUERY_OBJECT));
  });

  test("complex type: query", async () => {
    await testService.navigate_to_people("tester").navigate_to_home_address().query();

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/HomeAddress`);
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastData).toBeUndefined();
  });

  test("complex type: update", async () => {
    const complex = testService.navigate_to_people("tester").navigate_to_home_address();

    const model: EDITABLE_LOCATION = {
      address: "Test Address",
      city: { name: "Test City" },
    };
    await complex.update(model);

    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/HomeAddress`);
    expect(odataClient.lastData).toStrictEqual({
      Address: "Test Address",
      City: { Name: "Test City" },
    });
  });

  test("complex collection", async () => {
    const complex = testService.navigate_to_people("tester").navigate_to_address_info();

    expect(complex.getPath()).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(JSON.stringify(complex.getQObject())).toEqual(JSON.stringify(lOCATION_QUERY_OBJECT));
  });

  test("complex collection: query", async () => {
    await testService.navigate_to_people("tester").navigate_to_address_info().query();

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastData).toBeUndefined();
  });

  test("complex collection: create", async () => {
    const model: EDITABLE_LOCATION = { address: "TestAdress" };
    await testService.navigate_to_people("tester").navigate_to_address_info().add(model);

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastData).toStrictEqual({ Address: "TestAdress" });
  });

  test("complex collection: update", async () => {
    const models = [{ address: "TestAddress 1" }, { address: "test 2" }];
    await testService.navigate_to_people("tester").navigate_to_address_info().update(models);

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastData).toStrictEqual([{ Address: "TestAddress 1" }, { Address: "test 2" }]);
  });

  test("complex collection: delete", async () => {
    await testService.navigate_to_people("tester").navigate_to_address_info().delete();

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastData).toBeUndefined();
  });

  test("navigation", async () => {
    const result = testService
      .navigate_to_people("tester")
      .navigate_to_best_friend()
      .navigate_to_best_friend()
      .navigate_to_best_friend()
      .navigate_to_home_address()
      .navigate_to_city();

    expect(result.getPath()).toBe(`${BASE_URL}/People('tester')/BestFriend/BestFriend/BestFriend/HomeAddress/City`);
  });

  test("singleton", async () => {
    const result = testService.navigate_to_me();

    expect(result.getPath()).toBe(`${BASE_URL}/Me`);
    expect(JSON.stringify(result.getQObject())).toEqual(JSON.stringify(pERSON_QUERY_OBJECT));
  });
});
