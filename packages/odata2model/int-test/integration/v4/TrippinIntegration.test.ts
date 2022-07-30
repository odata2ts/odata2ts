import { TestODataClient } from "../../TestODataClient";
import { TrippinService } from "../../../build/v4/trippin/TrippinService";

describe("Integration Testing of Service Generation", () => {
  const BASE_URL = "https://services.odata.org/TripPinRESTierService/(S(sivik5crfo3qvprrreziudlp))";
  const odataClient = new TestODataClient();

  const testService = new TrippinService(odataClient, BASE_URL);

  test("unbound action", async () => {
    const result = await testService.resetDataSource();
    expect(result.data).toBe("");
  });

  test("unbound function", async () => {
    const result = await testService.getPersonWithMostFriends();
    expect(result.data.FirstName).toBe("Russell");
    expect(result.data.LastName).toBe("Whyte");
  });

  test("unbound function with params", async () => {
    const result = await testService.getNearestAirport({ lat: 123, lon: 345 });
    expect(result.data.IcaoCode).toBe("ZBAA");
  });

  test("entityType query", async () => {
    const result = await testService.people.get("russellwhyte").query();
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.FirstName).toBe("Russell");
    expect(result.data.LastName).toBe("Whyte");
  });

  test("entitySet query", async () => {
    const result = await testService.people.query();
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.value.length).toBe(20);
  });

  test("entitySet query people with any Feature 1", async () => {
    const result = await testService.people.query((builder, qPerson) => {
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
        FirstName: "Ronald",
        LastName: "Mundy",
        Trips: [
          {
            Budget: 6000,
            Description: "Gradution trip with friends",
          },
        ],
      },
      {
        FirstName: "Russell",
        LastName: "Whyte",
        Trips: [
          {
            Budget: 3000,
            Description: "Trip from San Francisco to New York City",
          },
          {
            Budget: 2000,
            Description: "Trip from Shanghai to Beijing",
          },
          {
            Budget: 2650,
            Description: "Happy honeymoon trip",
          },
        ],
      },
      {
        FirstName: "Scott",
        LastName: "Ketchum",
        Trips: [
          {
            Budget: 5000,
            Description: "Trip from San Francisco to New York City",
          },
          {
            Budget: 11000,
            Description: "Trip from Shanghai to Beijing",
          },
        ],
      },
      {
        FirstName: "Willie",
        LastName: "Ashmore",
        Trips: [
          {
            Budget: 3800.5,
            Description: "This is my first business trip",
          },
          {
            Budget: 2000,
            Description: "The trip is currently in plan.",
          },
        ],
      },
    ]);
  });

  test("collection of strings", async () => {
    const result = await testService.people.get("russellwhyte").addressInfo.query();

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.value.length).toBe(1);
    expect(result.data.value[0].Address).toBe("187 Suffolk Ln.");
  });
});
