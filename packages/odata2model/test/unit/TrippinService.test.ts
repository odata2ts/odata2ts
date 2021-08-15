import { MockODataClient } from "./../MockODataClient";
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

  test("entitSet - get", async () => {
    await testService.people.query((queryBuilder) => {
      queryBuilder.select("firstName", "lastName").build();
    });

    expect(odataClient.lastUrl).toBe(
      `${BASE_URL}/People?${encodeURIComponent("$select")}=${encodeURIComponent("FirstName,LastName")}`
    );
    expect(odataClient.lastData).toEqual({});
  });
});
