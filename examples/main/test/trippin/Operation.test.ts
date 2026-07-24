import { describe, expect, test } from "vitest";
import { BASE_URL, ODATA_CLIENT, TRIPPIN } from "./TrippinTestConstants.js";

describe("Trippin: Operation Test", function () {
  test("unbound function", async () => {
    await TRIPPIN.getPersonWithMostFriends().execute();
    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/GetPersonWithMostFriends()`);
  });

  test("unbound function with params", async () => {
    await TRIPPIN.getNearestAirport({ lat: 123, lon: 345 }).execute();
    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/GetNearestAirport(lat=123,lon=345)`);
  });

  test("bound function", async () => {
    await TRIPPIN.people("aba").getFavoriteAirline().execute();
    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('aba')/Trippin.GetFavoriteAirline()`);
  });

  test("bound function with params", async () => {
    await TRIPPIN.people("aba").getFriendsTrips({ userName: "ddd" }).execute();
    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('aba')/Trippin.GetFriendsTrips(userName='ddd')`);
  });

  test("unbound action", async () => {
    await TRIPPIN.resetDataSource().execute();
    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/ResetDataSource`);
    expect(ODATA_CLIENT.lastData).toEqual(undefined);
  });

  test("bound action", async () => {
    const payload = { lastName: "test" };
    await TRIPPIN.people("aba").updateLastName(payload).execute();
    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/People('aba')/Trippin.UpdateLastName`);
    expect(ODATA_CLIENT.lastData).toEqual(payload);
  });
});
