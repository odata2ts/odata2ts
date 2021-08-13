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
});
