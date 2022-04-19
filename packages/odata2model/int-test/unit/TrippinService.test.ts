import { LocationModel } from "../../build/v4/trippin/TrippinModel";
import { qPerson, qLocation } from "../../build/v4/trippin/QTrippin";
import { TrippinService } from "../../build/v4/trippin/TrippinService";
import { MockODataClient } from "../MockODataClient";

describe("Testing Generation of TrippinService", () => {
  const BASE_URL = "/test";
  const odataClient = new MockODataClient();

  const testService = new TrippinService(odataClient, BASE_URL);

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

    expect(testService.people.getPath()).toBe(expected);
    expect(JSON.stringify(testService.people.getQObject())).toEqual(JSON.stringify(qPerson));
    expect(testService.people.getKeySpec()).toEqual([{ isLiteral: false, name: "userName", odataName: "UserName" }]);
  });

  test("entitySet: get", async () => {
    const testId = "test";
    const expected = `${BASE_URL}/People('${testId}')`;

    expect(testService.people.get(testId).getPath()).toBe(expected);
    expect(JSON.stringify(testService.people.get(testId).getQObject())).toEqual(JSON.stringify(qPerson));
  });

  test("entitySet: get with complex id", async () => {
    const testId = { UserName: "tester" };
    const expected = `${BASE_URL}/People(UserName='tester')`;

    expect(testService.people.get(testId).getPath()).toBe(expected);
  });

  test("complex type", async () => {
    const complex = testService.people.get("tester").homeAddress;

    expect(complex.getPath()).toBe(`${BASE_URL}/People('tester')/HomeAddress`);
    expect(JSON.stringify(complex.getQObject())).toEqual(JSON.stringify(qLocation));
  });

  test("complex type: query", async () => {
    await testService.people.get("tester").homeAddress.query();

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/HomeAddress`);
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastData).toBeUndefined();
  });

  test("complex collection", async () => {
    const complex = testService.people.get("tester").addressInfo;

    expect(complex.getPath()).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(JSON.stringify(complex.getQObject())).toEqual(JSON.stringify(qLocation));
  });

  test("complex collection: query", async () => {
    await testService.people.get("tester").addressInfo.query();

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastData).toBeUndefined();
  });

  test("complex collection: create", async () => {
    const model: LocationModel = { Address: "TestAdress" };
    await testService.people.get("tester").addressInfo.add(model);

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastData).toEqual(model);
  });

  test("complex collection: update", async () => {
    const models = [{ Address: "TestAddress 1" }, { Address: "test 2" }];
    await testService.people.get("tester").addressInfo.update(models);

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastData).toEqual(models);
  });

  test("complex collection: delete", async () => {
    await testService.people.get("tester").addressInfo.delete();

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastData).toBeUndefined();
  });

  test("navigation", async () => {
    const result = testService.people.get("tester").bestFriend.bestFriend.bestFriend.homeAddress.city;

    expect(result.getPath()).toBe(`${BASE_URL}/People('tester')/BestFriend/BestFriend/BestFriend/HomeAddress/City`);
  });

  test("singleton", async () => {
    const result = testService.me;

    expect(result.getPath()).toBe(`${BASE_URL}/Me`);
    expect(JSON.stringify(result.getQObject())).toEqual(JSON.stringify(qPerson));
  });
});
