import { ODataClient } from "@odata2ts/odata-client-api";

import { EntitySetServiceV2, EntitySetServiceV4 } from "../src";
import { EditablePersonModel, Feature, PersonId, PersonModel } from "./fixture/PersonModel";
import { QPersonV2 } from "./fixture/v2/QPersonV2";
import { QPersonV4 } from "./fixture/v4/QPersonV4";
import { MockODataClient } from "./mock/MockODataClient";

export function commonEntitySetTests(
  odataClient: MockODataClient,
  serviceConstructor: new (odataClient: ODataClient, baseUrl: string, name: string) =>
    | EntitySetServiceV4<MockODataClient, PersonModel, EditablePersonModel, QPersonV4, PersonId, any>
    | EntitySetServiceV2<MockODataClient, PersonModel, EditablePersonModel, QPersonV2, PersonId, any>
) {
  const BASE_URL = "/base";
  const NAME = "EntityXY";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;
  const REQUEST_CONFIG = { test: "Test" };

  let testService:
    | EntitySetServiceV4<MockODataClient, PersonModel, EditablePersonModel, QPersonV4, PersonId, any>
    | EntitySetServiceV2<MockODataClient, PersonModel, EditablePersonModel, QPersonV2, PersonId, any>;

  beforeEach(() => {
    testService = new serviceConstructor(odataClient, BASE_URL, NAME);
  });

  test("entitySet: setup", async () => {
    expect(testService.getPath()).toBe(EXPECTED_PATH);
    expect(testService.getQObject()).not.toBeNull();
  });

  test("entitySet: createKey", async () => {
    expect(testService.createKey("xxx")).toBe(`${NAME}('xxx')`);
    expect(testService.createKey({ UserName: "xxx" })).toBe(`${NAME}(UserName='xxx')`);
  });

  test("entitySet: parseKey", async () => {
    expect(testService.parseKey(`${NAME}('xxx')`)).toBe("xxx");
    expect(testService.parseKey(`${NAME}(UserName='xxx')`)).toStrictEqual({ UserName: "xxx" });
  });

  test("entitySet: query", async () => {
    const expected = `${EXPECTED_PATH}`;

    await testService.query();
    expect(odataClient.lastUrl).toBe(expected);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastRequestConfig).toBeUndefined();

    await testService.query(undefined, REQUEST_CONFIG);
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
  });

  test("entitySet: query with select", async () => {
    const expected = `${EXPECTED_PATH}?${encodeURIComponent("$select")}=${encodeURIComponent("UserName,Age")}`;

    await testService.query((queryBuilder) => queryBuilder.select("userName", "age"));

    expect(odataClient.lastUrl).toBe(expected);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("entitySet: query with qObject", async () => {
    const expected = `${EXPECTED_PATH}?${encodeURIComponent("$filter")}=${encodeURIComponent("Age gt 18")}`;

    await testService.query((queryBuilder, qObj) => queryBuilder.filter(qObj.age.gt(18)));

    expect(odataClient.lastUrl).toBe(expected);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("entitySet: create", async () => {
    const model: PersonModel = {
      UserName: "tester",
      Age: 14,
      FavFeature: Feature.Feature1,
      Features: [Feature.Feature1],
      Friends: [],
    };
    await testService.create(model);

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastData).toEqual(model);
    expect(odataClient.lastRequestConfig).toBeUndefined();

    await testService.create(model, REQUEST_CONFIG);
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
  });

  test("entitySet: patch", async () => {
    const model: Partial<PersonModel> = {
      Age: 45,
    };
    await testService.patch("tester", model);

    expect(odataClient.lastUrl).toBe(`${EXPECTED_PATH}('tester')`);
    expect(odataClient.lastOperation).toBe("PATCH");
    expect(odataClient.lastData).toEqual(model);
    expect(odataClient.lastRequestConfig).toBeUndefined();

    await testService.patch("tester", model, REQUEST_CONFIG);
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
  });

  test("entitySet: delete", async () => {
    await testService.delete("tester");

    expect(odataClient.lastUrl).toBe(`${EXPECTED_PATH}('tester')`);
    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastRequestConfig).toBeUndefined();

    await testService.delete("tester", REQUEST_CONFIG);
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
  });
}
