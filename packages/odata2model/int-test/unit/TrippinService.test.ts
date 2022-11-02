import { qLocation, qPerson } from "../../build/v4/trippin/QTrippin";
import {
  EditableLocationModel,
  EditablePersonModel,
  FeatureModel,
  PersonGenderModel,
  PersonIdModel,
} from "../../build/v4/trippin/TrippinModel";
import { TrippinService } from "../../build/v4/trippin/TrippinService";
import { MockODataClient } from "../MockODataClient";

describe("Testing Generation of TrippinService", () => {
  const BASE_URL = "/test";
  const odataClient = new MockODataClient();

  const testService = new TrippinService(odataClient, BASE_URL);

  let editModel: EditablePersonModel;

  beforeEach(() => {
    editModel = {
      user: "williams",
      favoriteFeature: FeatureModel.Feature1,
      features: [],
      firstName: "Heinz",
      traditionalGenderCategories: PersonGenderModel.Unknown,
    };
  });

  test("unbound function", async () => {
    await testService.getPersonWithMostFriends();
    expect(odataClient.lastUrl).toBe(`${BASE_URL}/GetPersonWithMostFriends()`);
  });

  test("unbound function with params", async () => {
    await testService.getNearestAirport({ lat: 123, lon: 345 });
    expect(odataClient.lastUrl).toBe(`${BASE_URL}/GetNearestAirport(lat=123,lon=345)`);
  });

  test("unbound action", async () => {
    await testService.resetDataSource();
    expect(odataClient.lastUrl).toBe(`${BASE_URL}/ResetDataSource`);
    expect(odataClient.lastData).toEqual({});
  });

  test("entitySet", async () => {
    const expected = `${BASE_URL}/People`;

    expect(testService.getPeopleSrv().getPath()).toBe(expected);
    expect(JSON.stringify(testService.getPeopleSrv().getQObject())).toEqual(JSON.stringify(qPerson));
    expect(testService.getPeopleSrv().getKeySpec().length).toBe(1);
    expect(testService.getPeopleSrv().getKeySpec()[0].getName()).toEqual("UserName");
  });

  test("entitySet: create", async () => {
    const expectedUrl = `${BASE_URL}/People`;

    await testService.getPeopleSrv().create(editModel);

    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastUrl).toBe(expectedUrl);
    expect(odataClient.lastData).toBe(editModel);
  });

  test("entitySet: get", async () => {
    const testId = "test";
    const expected = `${BASE_URL}/People('${testId}')`;

    const etService = testService.getPeopleSrv().get(testId);

    expect(etService.getPath()).toBe(expected);
    expect(JSON.stringify(etService.getQObject())).toEqual(JSON.stringify(qPerson));
  });

  test("entitySet: get with complex id", async () => {
    const testId: PersonIdModel = { user: "williams" };
    const expected = `${BASE_URL}/People(UserName='williams')`;

    expect(testService.getPeopleSrv().get(testId).getPath()).toBe(expected);
  });

  test("entityType: update", async () => {
    const id = "williams";
    const expectedUrl = `${BASE_URL}/People('${id}')`;
    const model: EditablePersonModel = {
      user: "williams",
      favoriteFeature: FeatureModel.Feature1,
      features: [],
      firstName: "Heinz",
      traditionalGenderCategories: PersonGenderModel.Unknown,
      age: 33,
    };

    await testService.getPeopleSrv().get(id).update(model);

    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastUrl).toBe(expectedUrl);
    expect(odataClient.lastData).toBe(model);
  });

  test("entityType: patch", async () => {
    const id = "williams";
    const expectedUrl = `${BASE_URL}/People('${id}')`;
    const model = {
      age: 44,
    };

    await testService.getPeopleSrv().get(id).patch(model);

    expect(odataClient.lastOperation).toBe("PATCH");
    expect(odataClient.lastUrl).toBe(expectedUrl);
    expect(odataClient.lastData).toBe(model);
  });

  test("entityType: delete", async () => {
    const id = "williams";
    const expectedUrl = `${BASE_URL}/People('${id}')`;

    await testService.getPeopleSrv().get(id).delete();

    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastUrl).toBe(expectedUrl);
    expect(odataClient.lastData).toBe(undefined);
  });

  test("complex type", async () => {
    const complex = testService.getPeopleSrv().get("tester").getHomeAddressSrv();

    expect(complex.getPath()).toBe(`${BASE_URL}/People('tester')/HomeAddress`);
    expect(JSON.stringify(complex.getQObject())).toEqual(JSON.stringify(qLocation));
  });

  test("complex type: query", async () => {
    await testService.getPeopleSrv().get("tester").getHomeAddressSrv().query();

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/HomeAddress`);
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastData).toBeUndefined();
  });

  test("complex type: update", async () => {
    const complex = testService.getPeopleSrv().get("tester").getHomeAddressSrv();

    const model: EditableLocationModel = {
      address: "Test Address",
      city: { name: "Test City" },
    };
    await complex.update(model);

    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/HomeAddress`);
    expect(odataClient.lastData).toStrictEqual(model);
  });

  test("complex collection", async () => {
    const complex = testService.getPeopleSrv().get("tester").getAddressInfoSrv();

    expect(complex.getPath()).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(JSON.stringify(complex.getQObject())).toEqual(JSON.stringify(qLocation));
  });

  test("complex collection: query", async () => {
    await testService.getPeopleSrv().get("tester").getAddressInfoSrv().query();

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastData).toBeUndefined();
  });

  test("complex collection: create", async () => {
    const model: EditableLocationModel = { address: "TestAdress" };
    await testService.getPeopleSrv().get("tester").getAddressInfoSrv().add(model);

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastData).toEqual(model);
  });

  test("complex collection: update", async () => {
    const models = [{ address: "TestAddress 1" }, { address: "test 2" }];
    await testService.getPeopleSrv().get("tester").getAddressInfoSrv().update(models);

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastData).toEqual(models);
  });

  test("complex collection: delete", async () => {
    await testService.getPeopleSrv().get("tester").getAddressInfoSrv().delete();

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastData).toBeUndefined();
  });

  test("navigation", async () => {
    const result = testService
      .getPeopleSrv()
      .get("tester")
      .getBestFriendSrv()
      .getBestFriendSrv()
      .getBestFriendSrv()
      .getHomeAddressSrv()
      .getCitySrv();

    expect(result.getPath()).toBe(`${BASE_URL}/People('tester')/BestFriend/BestFriend/BestFriend/HomeAddress/City`);
  });

  test("singleton", async () => {
    const result = testService.getMeSrv();

    expect(result.getPath()).toBe(`${BASE_URL}/Me`);
    expect(JSON.stringify(result.getQObject())).toEqual(JSON.stringify(qPerson));
  });
});
