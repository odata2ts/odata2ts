import { Address } from "./../../../odata-uri-builder/test/fixture/types/custom/Address";
import { Feature, LocationModel, PersonGender, PersonModel } from "./../../build/TrippinModel";
import { MockODataClient } from "./../MockODataClient";
import { qPerson, qLocation } from "./../../build/QTrippin";
import { TrippinService } from "../../build/TrippinService";

describe("Testing Generation of TrippinService", () => {
  const BASE_URL = "/test";
  const odataClient = new MockODataClient();

  const testService = new TrippinService(odataClient, BASE_URL);

  test("unbound function", async () => {
    await testService.getPersonWithMostFriends();
    expect(odataClient.lastUrl).toBe(`${BASE_URL}/GetPersonWithMostFriends`);
  });

  test("unbound function with params", async () => {
    const result = await testService.getNearestAirport(123, 345);
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
    expect(testService.people.getQOjbect()).toBe(qPerson);
    expect(testService.people.getKeySpec()).toEqual([{ isLiteral: false, name: "userName", odataName: "UserName" }]);
  });

  test("entitySet: get", async () => {
    const testId = "test";
    const expected = `${BASE_URL}/People('${testId}')`;

    expect(testService.people.get(testId).getPath()).toBe(expected);
    expect(testService.people.get(testId).getQOjbect()).toBe(qPerson);
  });

  test("entitySet: get with complex id", async () => {
    const testId = { userName: "tester" };
    const expected = `${BASE_URL}/People(UserName='tester')`;

    expect(testService.people.get(testId).getPath()).toBe(expected);
    expect(testService.people.get(testId).getQOjbect()).toBe(qPerson);
  });

  test("entitySet: query", async () => {
    const expected = `${BASE_URL}/People`;

    await testService.people.query();
    expect(odataClient.lastUrl).toBe(expected);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("entitySet: query with select", async () => {
    const expected = `${BASE_URL}/People`;

    await testService.people.query((queryBuilder) => queryBuilder.select("firstName", "lastName"));

    expect(odataClient.lastUrl).toBe(
      `${expected}?${encodeURIComponent("$select")}=${encodeURIComponent("FirstName,LastName")}`
    );
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("entitySet: query with qObject", async () => {
    const expected = `${BASE_URL}/People`;

    await testService.people.query((queryBuilder, qObj) => queryBuilder.filter(qObj.age.gt(18)));

    expect(odataClient.lastUrl).toBe(`${expected}?${encodeURIComponent("$filter")}=${encodeURIComponent("Age gt 18")}`);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("entitySet: create", async () => {
    const model: PersonModel = {
      UserName: "tester",
      FirstName: "Heinz",
      LastName: "Tester",
      Gender: PersonGender.Unknown,
      FavoriteFeature: Feature.Feature4,
      Features: [Feature.Feature2],
    };
    await testService.people.create(model);

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People`);
    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastData).toEqual(model);
  });

  test("entitySet: patch", async () => {
    const model: Partial<PersonModel> = {
      FavoriteFeature: Feature.Feature3,
    };
    await testService.people.patch("tester", model);

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')`);
    expect(odataClient.lastOperation).toBe("PATCH");
    expect(odataClient.lastData).toEqual(model);
  });

  test("entitySet: delete", async () => {
    await testService.people.delete("tester");

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')`);
    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastData).toBeUndefined();
  });

  test("entityType: query", async () => {
    const expected = `${BASE_URL}/People('tester')`;

    await testService.people.get("tester").query();

    expect(odataClient.lastUrl).toBe(expected);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("entityType: query with expand", async () => {
    const expected = `${BASE_URL}/People('tester')`;

    await testService.people.get("tester").query((queryBuilder) => queryBuilder.expand("addressInfo"));

    expect(odataClient.lastUrl).toBe(`${expected}?${encodeURIComponent("$expand")}=AddressInfo`);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("entityType: patch", async () => {
    const model: Partial<PersonModel> = {
      FavoriteFeature: Feature.Feature3,
    };
    await testService.people.get("tester").patch(model);

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')`);
    expect(odataClient.lastOperation).toBe("PATCH");
    expect(odataClient.lastData).toEqual(model);
  });

  test("entityType: delete", async () => {
    await testService.people.get("tester").delete();

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')`);
    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastData).toBeUndefined();
  });

  test("complex type", async () => {
    const complex = testService.people.get("tester").homeAddress;

    expect(complex.getPath()).toBe(`${BASE_URL}/People('tester')/HomeAddress`);
    expect(complex.getQOjbect()).toBe(qLocation);
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
    expect(complex.getQOjbect()).toBe(qLocation);
  });

  test("complex collection: query", async () => {
    await testService.people.get("tester").addressInfo.query();

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastData).toBeUndefined();
  });

  test("complex collection: create", async () => {
    const model: LocationModel = { Address: "TestAdress" };
    await testService.people.get("tester").addressInfo.create(model);

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
});
