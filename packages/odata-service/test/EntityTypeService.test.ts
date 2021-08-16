import { MockODataClient } from "./MockODataClient";
import { Feature, PersonModel, PersonModelService } from "./fixture/PersonModelService";

describe("EntityTypeService Test", () => {
  const odataClient = new MockODataClient();
  const BASE_URL = "/test('tester')";

  let testService: PersonModelService;

  beforeEach(() => {
    testService = new PersonModelService(odataClient, BASE_URL);
  });

  test("entityType: query", async () => {
    const expected = `${BASE_URL}`;

    await testService.query();
    expect(odataClient.lastUrl).toBe(expected);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("entityType: query with select", async () => {
    const expected = `${BASE_URL}?${encodeURIComponent("$select")}=${encodeURIComponent("UserName,Age")}`;

    await testService.query((queryBuilder) => queryBuilder.select("userName", "age"));

    expect(odataClient.lastUrl).toBe(expected);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("entityType: query with qObject", async () => {
    const expected = `${BASE_URL}?${encodeURIComponent("$filter")}=${encodeURIComponent("Age gt 18")}`;

    await testService.query((queryBuilder, qObj) => queryBuilder.filter(qObj.age.gt(18)));

    expect(odataClient.lastUrl).toBe(expected);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("entityType: no create", async () => {
    // @ts-expect-error: expected, because the create method shouldn't exist
    expect(testService.create).toBeUndefined;
  });

  test("entityType: patch", async () => {
    const model: Partial<PersonModel> = {
      Age: 45,
    };
    await testService.patch(model);

    expect(odataClient.lastUrl).toBe(BASE_URL);
    expect(odataClient.lastOperation).toBe("PATCH");
    expect(odataClient.lastData).toEqual(model);
  });

  test("entityType: delete", async () => {
    await testService.delete();

    expect(odataClient.lastUrl).toBe(BASE_URL);
    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastData).toBeUndefined();
  });
});
