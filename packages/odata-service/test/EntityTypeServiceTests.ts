import { ODataClient } from "@odata2ts/odata-client-api";

import { MockODataClient } from "./mock/MockODataClient";
import { PersonModel, PersonModelServiceVersion } from "./fixture/PersonModel";

export function commonEntityTypeServiceTests(
  odataClient: MockODataClient,
  serviceConstructor: new (odataClient: ODataClient, url: string) => PersonModelServiceVersion
) {
  const BASE_URL = "/test('tester')";
  const REQUEST_CONFIG = { test: "Test" };

  let testService: PersonModelServiceVersion;

  beforeEach(() => {
    testService = new serviceConstructor(odataClient, BASE_URL);
  });

  test("entitySet: setup", async () => {
    expect(testService.getPath()).toBe(BASE_URL);
  });

  test("entityType: query", async () => {
    const expected = `${BASE_URL}`;

    await testService.query();

    expect(odataClient.lastUrl).toBe(expected);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastRequestConfig).toBeUndefined();

    await testService.query(undefined, REQUEST_CONFIG);
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
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
    expect(odataClient.lastRequestConfig).toBeUndefined();

    await testService.patch(model, REQUEST_CONFIG);
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
  });

  test("entityType: delete", async () => {
    await testService.delete();

    expect(odataClient.lastUrl).toBe(BASE_URL);
    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastRequestConfig).toBeUndefined();

    await testService.delete(REQUEST_CONFIG);
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
  });
}
