import { MockODataClient } from "./mock/MockODataClient";
import { EditablePersonModel, Feature, PersonModel } from "./fixture/PersonModel";
import { QPersonV4 } from "./fixture/v4/PersonModelService";
import { QPersonV2 } from "./fixture/v2/PersonModelService";
import { ODataClient } from "@odata2ts/odata-client-api";
import { EntitySetServiceV2, EntitySetServiceV4 } from "../src";

export function commonEntitySetTests(
  odataClient: MockODataClient,
  serviceConstructor: new (odataClient: ODataClient, baseUrl: string) =>
    | EntitySetServiceV4<PersonModel, EditablePersonModel, QPersonV4, any, any>
    | EntitySetServiceV2<PersonModel, EditablePersonModel, QPersonV2, any, any>
) {
  const BASE_URL = "/test";

  let testService:
    | EntitySetServiceV4<PersonModel, EditablePersonModel, QPersonV4, any, any>
    | EntitySetServiceV2<PersonModel, EditablePersonModel, QPersonV2, any, any>;

  beforeEach(() => {
    testService = new serviceConstructor(odataClient, BASE_URL);
  });

  test("entitySet: setup", async () => {
    expect(testService.getPath()).toBe(BASE_URL);
    expect(testService.getQObject()).not.toBeNull();
  });

  test("entitySet: query", async () => {
    const expected = `${BASE_URL}`;

    await testService.query();
    expect(odataClient.lastUrl).toBe(expected);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("entitySet: query with select", async () => {
    const expected = `${BASE_URL}?${encodeURIComponent("$select")}=${encodeURIComponent("UserName,Age")}`;

    await testService.query((queryBuilder) => queryBuilder.select("userName", "age"));

    expect(odataClient.lastUrl).toBe(expected);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("entitySet: query with qObject", async () => {
    const expected = `${BASE_URL}?${encodeURIComponent("$filter")}=${encodeURIComponent("Age gt 18")}`;

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

    expect(odataClient.lastUrl).toBe(BASE_URL);
    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastData).toEqual(model);
  });

  test("entitySet: patch", async () => {
    const model: Partial<PersonModel> = {
      Age: 45,
    };
    await testService.patch("tester", model);

    expect(odataClient.lastUrl).toBe(`${BASE_URL}('tester')`);
    expect(odataClient.lastOperation).toBe("PATCH");
    expect(odataClient.lastData).toEqual(model);
  });

  test("entitySet: delete", async () => {
    await testService.delete("tester");

    expect(odataClient.lastUrl).toBe(`${BASE_URL}('tester')`);
    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastData).toBeUndefined();
  });
}
