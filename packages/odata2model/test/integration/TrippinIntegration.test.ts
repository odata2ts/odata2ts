import { TestODataClient } from "../TestODataClient";
import { TrippinService } from "../../build/TrippinService";

describe("Integration Testing of Service Generation", () => {
  const BASE_URL = "https://services.odata.org/TripPinRESTierService/(S(sivik5crfo3qvprrreziudlp))";
  const odataClient = new TestODataClient();

  const testService = new TrippinService(odataClient, BASE_URL);

  test("unbound function", async () => {
    const result = await testService.getPersonWithMostFriends();
    expect(result.data.FirstName).toBe("Russell");
    expect(result.data.LastName).toBe("Whyte");
  });

  test("unbound function with params", async () => {
    const result = await testService.getNearestAirport(123, 345);
    expect(result.data.IcaoCode).toBe("ZBAA");
  });

  test("entityType query", async () => {
    const result = await testService.people.get("russellwhyte").query();
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined;
    expect(result.data.FirstName).toBe("Russell");
    expect(result.data.LastName).toBe("Whyte");
  });

  test("entitySet query", async () => {
    const result = await testService.people.query();
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined;
    expect(result.data.value.length).toBe(20);
  });

  test("collection of strings", async () => {
    const result = await testService.people.get("russellwhyte").addressInfo.query();

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined;
    expect(result.data.value.length).toBe(1);
    expect(result.data.value[0].Address).toBe("187 Suffolk Ln.");
  });
});
