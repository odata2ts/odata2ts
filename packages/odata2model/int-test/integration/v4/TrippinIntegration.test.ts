import { PersonIdModel } from "../../../build/v4/trippin/TrippinModel";
import { TrippinService } from "../../../build/v4/trippin/TrippinService";
import { TestODataClient } from "../../TestODataClient";

describe("Integration Testing of Service Generation", () => {
  const BASE_URL = "https://services.odata.org/TripPinRESTierService/(S(sivik5crfo3qvprrreziudlp))";
  const odataClient = new TestODataClient();

  const testService = new TrippinService(odataClient, BASE_URL);

  // skipped, because it breaks the session state
  test.skip("unbound action", async () => {
    const result = await testService.resetDataSourceAction();
    expect(result.data).toBe("");
  });

  test("unbound function", async () => {
    const result = await testService.getPersonWithMostFriendsFunction();
    expect(result.data.firstName).toBe("Russell");
    expect(result.data.lastName).toBe("Whyte");
  });

  test("unbound function with params", async () => {
    const result = await testService.getNearestAirportFunction({ lat: 123, lon: 345 });
    expect(result.data.icaoCode).toBe("ZBAA");
  });

  test("entityType query", async () => {
    const result = await testService.navToPeople().get("russellwhyte").query();
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.firstName).toBe("Russell");
    expect(result.data.lastName).toBe("Whyte");
  });

  test("entitySet query", async () => {
    const result = await testService.navToPeople().query();
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.value.length).toBe(20);
  });

  test("entitySet query people with any Feature 1", async () => {
    const result = await testService.navToPeople().query((builder, qPerson) => {
      return builder
        .count()
        .top(10)
        .select("firstName", "lastName")
        .filter(qPerson.trips.any((qTrip) => qTrip.budget.gt(2999)))
        .expanding("trips", (tBuilder) => tBuilder.select("description", "budget"));
    });
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject({ "@odata.count": 4 });
    expect(result.data.value.length).toBe(4);
    expect(result.data.value).toStrictEqual([
      {
        firstName: "Ronald",
        lastName: "Mundy",
        trips: [
          {
            budget: 6000,
            description: "Gradution trip with friends",
          },
        ],
      },
      {
        firstName: "Russell",
        lastName: "Whyte",
        trips: [
          {
            budget: 3000,
            description: "Trip from San Francisco to New York City",
          },
          {
            budget: 2000,
            description: "Trip from Shanghai to Beijing",
          },
          {
            budget: 2650,
            description: "Happy honeymoon trip",
          },
        ],
      },
      {
        firstName: "Scott",
        lastName: "Ketchum",
        trips: [
          {
            budget: 5000,
            description: "Trip from San Francisco to New York City",
          },
          {
            budget: 11000,
            description: "Trip from Shanghai to Beijing",
          },
        ],
      },
      {
        firstName: "Willie",
        lastName: "Ashmore",
        trips: [
          {
            budget: 3800.5,
            description: "This is my first business trip",
          },
          {
            budget: 2000,
            description: "The trip is currently in plan.",
          },
        ],
      },
    ]);
  });

  test("collection of strings", async () => {
    const result = await testService.navToPeople().get("russellwhyte").navToAddressInfo().query();

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.value.length).toBe(1);
    expect(result.data.value[0].address).toBe("187 Suffolk Ln.");
  });

  test("create key and parse key", async () => {
    const expectedSimple = "test@testing.de";
    const expectedComplex: PersonIdModel = { user: expectedSimple };

    // simple version
    let result = testService.navToPeople().createKey(expectedSimple);
    expect(result).toBe(`People('${expectedSimple}')`);
    expect(testService.navToPeople().parseKey(result)).toBe(expectedSimple);

    // complex version
    result = testService.navToPeople().createKey(expectedComplex);
    expect(result).toBe(`People(UserName='${expectedSimple}')`);
    expect(testService.navToPeople().parseKey(result)).toStrictEqual(expectedComplex);
  });
});
