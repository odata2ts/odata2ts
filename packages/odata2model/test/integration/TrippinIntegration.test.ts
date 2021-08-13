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
});
