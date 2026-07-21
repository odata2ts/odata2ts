import { describe, expect, test } from "vitest";
import { BASE_URL, ODATA_CLIENT, TRIPPIN } from "./TrippinRwTestConstants";

const TRIPPIN_NS = "Microsoft.OData.SampleService.Models.TripPin";

describe("Trippin: Operation Test", function () {
  test("composable function", async () => {
    const request = TRIPPIN.people("aba").getFavoriteAirline();
    await request
      .compose()
      .query((b) => b.select("airlineCode"))
      .execute();
    expect(ODATA_CLIENT.lastUrl).toBe(
      `${BASE_URL}/People('aba')/${TRIPPIN_NS}.GetFavoriteAirline()?$select=AirlineCode`,
    );
  });

  test("unbound composable function", async () => {
    await TRIPPIN.getNearestAirport({ lat: 0, lon: 0 })
      .compose()
      .query((b) => b.select("icaoCode"))
      .execute();
    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/GetNearestAirport(lat=0,lon=0)?$select=IcaoCode`);
  });

  test("composable function followed by a navigation property (single-valued)", async () => {
    // the composed result is an Airport => navigate to its complex Location
    await TRIPPIN.getNearestAirport({ lat: 0, lon: 0 }).compose().location().query().execute();
    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/GetNearestAirport(lat=0,lon=0)/Location`);
  });

  test("composable function followed by a nested navigation path", async () => {
    // Airport => Location => City
    await TRIPPIN.getNearestAirport({ lat: 0, lon: 0 }).compose().location().city().query().execute();
    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/GetNearestAirport(lat=0,lon=0)/Location/City`);
  });

  test("composable function, navigation path plus query options at the leaf", async () => {
    await TRIPPIN.getNearestAirport({ lat: 0, lon: 0 })
      .compose()
      .location()
      .city()
      .query((b) => b.select("name"))
      .execute();
    expect(ODATA_CLIENT.lastUrl).toBe(`${BASE_URL}/GetNearestAirport(lat=0,lon=0)/Location/City?$select=Name`);
  });

  test("composable function returning a collection, with parameters and collection query options", async () => {
    await TRIPPIN.people("aba")
      .getFriendsTrips({ userName: "russellwhyte" })
      .compose()
      .query((b, q) => b.filter(q.budget.gt(500)).top(3))
      .execute();
    expect(ODATA_CLIENT.lastUrl).toBe(
      `${BASE_URL}/People('aba')/${TRIPPIN_NS}.GetFriendsTrips(userName='russellwhyte')?$filter=Budget gt 500&$top=3`,
    );
  });
});
