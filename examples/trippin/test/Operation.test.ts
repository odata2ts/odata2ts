import { BASE_URL, ODATA_CLIENT, TRIPPIN } from "./infra/TestConstants";

describe("Trippin: Operation Test", function () {
  test("unbound function", async () => {
    await TRIPPIN.getPersonWithMostFriends();
    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/GetPersonWithMostFriends()`);
  });

  test("unbound function with params", async () => {
    await TRIPPIN.getNearestAirport({ lat: 123, lon: 345 });
    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/GetNearestAirport(lat=123,lon=345)`);
  });

  test("unbound action", async () => {
    await TRIPPIN.resetDataSource();
    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/ResetDataSource`);
    expect(ODATA_CLIENT.lastData).toEqual({});
  });
});
