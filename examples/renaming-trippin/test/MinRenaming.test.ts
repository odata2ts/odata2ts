import { qLocation, qPerson } from "../generated-src/trippin-min/QTrippin";
import { EditableLocation, EditablePerson, Feature, PersonId } from "../generated-src/trippin-min/TrippinModel";
import { TrippinService } from "../generated-src/trippin-min/TrippinService";
import { MockODataClient } from "./MockODataClient";

// import { qLocation, qPerson } from "../generated-src/trippin-min/QTrippin";
// import { EditableLocation, EditablePerson, Feature, PersonId } from "../generated-src/trippin-min/TrippinModel";

describe("Testing Generation with min renaming options", () => {
  const BASE_URL = "/test";
  const odataClient = new MockODataClient();

  // noinspection JSPotentiallyInvalidConstructorUsAge
  const testService = new TrippinService(odataClient, BASE_URL);

  let editModel: EditablePerson;

  beforeEach(() => {
    editModel = {
      UserName: "williams",
      FavoriteFeature: Feature.Feature1,
      Features: [],
      FirstName: "Heinz",
    };
  });

  test("unbound function", async () => {
    await testService.GetPersonWithMostFriends();
    expect(odataClient.lastUrl).toBe(`${BASE_URL}/GetPersonWithMostFriends()`);
  });

  test("unbound function with params", async () => {
    await testService.GetNearestAirport({ lat: 123, lon: 345 });
    expect(odataClient.lastUrl).toBe(`${BASE_URL}/GetNearestAirport(lat=123,lon=345)`);
  });

  test("unbound action", async () => {
    await testService.ResetDataSource();
    expect(odataClient.lastUrl).toBe(`${BASE_URL}/ResetDataSource`);
    expect(odataClient.lastData).toEqual({});
  });

  test("entitySet", async () => {
    const expected = `${BASE_URL}/People`;

    expect(testService.People().getPath()).toBe(expected);
    expect(JSON.stringify(testService.People().getQObject())).toEqual(JSON.stringify(qPerson));
    expect(testService.People().getKeySpec().length).toBe(1);
    expect(testService.People().getKeySpec()[0].getName()).toEqual("UserName");
  });

  test("entitySet: create", async () => {
    const expectedUrl = `${BASE_URL}/People`;

    await testService.People().create(editModel);

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

    const etService = testService.People(testId);

    expect(etService.getPath()).toBe(expected);
    expect(JSON.stringify(etService.getQObject())).toEqual(JSON.stringify(qPerson));
  });

  test("entitySet: get with complex id", async () => {
    const testId: PersonId = { UserName: "williams" };
    const expected = `${BASE_URL}/People(UserName='williams')`;

    expect(testService.People(testId).getPath()).toBe(expected);
  });

  test("entityType: update", async () => {
    const id = "williams";
    const expectedUrl = `${BASE_URL}/People('${id}')`;
    const model: EditablePerson = {
      UserName: "williams",
      FavoriteFeature: Feature.Feature1,
      Features: [],
      FirstName: "Heinz",
      Age: 33,
    };

    await testService.People(id).update(model);

    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastUrl).toBe(expectedUrl);
    expect(odataClient.lastData).toStrictEqual({
      UserName: "williams",
      FavoriteFeature: Feature.Feature1,
      Features: [],
      FirstName: "Heinz",
      Age: 33,
    });
  });

  test("entityType: patch", async () => {
    const id = "williams";
    const expectedUrl = `${BASE_URL}/People('${id}')`;
    const model = {
      Age: 44,
    };

    await testService.People(id).patch(model);

    expect(odataClient.lastOperation).toBe("PATCH");
    expect(odataClient.lastUrl).toBe(expectedUrl);
    expect(odataClient.lastData).toStrictEqual({ Age: 44 });
  });

  test("entityType: delete", async () => {
    const id = "williams";
    const expectedUrl = `${BASE_URL}/People('${id}')`;

    await testService.People(id).delete();

    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastUrl).toBe(expectedUrl);
    expect(odataClient.lastData).toBe(undefined);
  });

  test("complex type", async () => {
    const complex = testService.People("tester").HomeAddress();

    expect(complex.getPath()).toBe(`${BASE_URL}/People('tester')/HomeAddress`);
    expect(JSON.stringify(complex.getQObject())).toEqual(JSON.stringify(qLocation));
  });

  test("complex type: query", async () => {
    await testService.People("tester").HomeAddress().query();

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/HomeAddress`);
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastData).toBeUndefined();
  });

  test("complex type: update", async () => {
    const complex = testService.People("tester").HomeAddress();

    const model: EditableLocation = {
      Address: "Test Address",
      City: { Name: "Test City" },
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
    const complex = testService.People("tester").AddressInfo();

    expect(complex.getPath()).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(JSON.stringify(complex.getQObject())).toEqual(JSON.stringify(qLocation));
  });

  test("complex collection: query", async () => {
    await testService.People("tester").AddressInfo().query();

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastData).toBeUndefined();
  });

  test("complex collection: create", async () => {
    const model: EditableLocation = { Address: "TestAdress" };
    await testService.People("tester").AddressInfo().add(model);

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastData).toStrictEqual({ Address: "TestAdress" });
  });

  test("complex collection: update", async () => {
    const models = [{ Address: "TestAddress 1" }, { Address: "test 2" }];
    await testService.People("tester").AddressInfo().update(models);

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastData).toStrictEqual([{ Address: "TestAddress 1" }, { Address: "test 2" }]);
  });

  test("complex collection: delete", async () => {
    await testService.People("tester").AddressInfo().delete();

    expect(odataClient.lastUrl).toBe(`${BASE_URL}/People('tester')/AddressInfo`);
    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastData).toBeUndefined();
  });

  test("navigation", async () => {
    const result = testService.People("tester").BestFriend().BestFriend().BestFriend().HomeAddress().City();

    expect(result.getPath()).toBe(`${BASE_URL}/People('tester')/BestFriend/BestFriend/BestFriend/HomeAddress/City`);
  });

  test("singleton", async () => {
    const result = testService.Me();

    expect(result.getPath()).toBe(`${BASE_URL}/Me`);
    expect(JSON.stringify(result.getQObject())).toEqual(JSON.stringify(qPerson));
  });
});
