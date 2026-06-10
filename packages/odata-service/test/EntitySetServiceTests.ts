import { beforeEach, expect, test } from "vitest";
import { EntitySetServiceV2, EntitySetServiceV4, ODataServiceOptions } from "../src";
import { DEFAULT_HEADERS } from "../src/RequestHeaders";
import { EditablePersonModel, Feature, PersonId, PersonModel } from "./fixture/PersonModel";
import { QPersonV2 } from "./fixture/v2/QPersonV2";
import { QPersonV4 } from "./fixture/v4/QPersonV4";
import { MockClient } from "./mock/MockClient";

export function commonEntitySetTests(
  odataClient: MockClient,
  serviceConstructor: new (
    odataClient: MockClient,
    baseUrl: string,
    name: string,
    options?: ODataServiceOptions,
  ) =>
    | EntitySetServiceV4<MockClient, PersonModel, EditablePersonModel, QPersonV4, PersonId>
    | EntitySetServiceV2<MockClient, PersonModel, EditablePersonModel, QPersonV2, PersonId>,
) {
  const BASE_URL = "/base";
  const NAME = "EntityXY";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;
  const REQUEST_CONFIG = { test: "Test" };

  let testService:
    | EntitySetServiceV4<MockClient, PersonModel, EditablePersonModel, QPersonV4, PersonId>
    | EntitySetServiceV2<MockClient, PersonModel, EditablePersonModel, QPersonV2, PersonId>;

  beforeEach(() => {
    testService = new serviceConstructor(odataClient, BASE_URL, NAME);
  });

  test("entitySet: setup", async () => {
    expect(testService.getPath()).toBe(EXPECTED_PATH);
  });

  test("entitySet: createKey", async () => {
    expect(testService.createKey("xxx")).toBe(`${NAME}('xxx')`);
    expect(testService.createKey({ userName: "xxx" })).toBe(`${NAME}(UserName='xxx')`);
  });

  test("entitySet: createKey without encoding", async () => {
    expect(testService.createKey("&/?", true)).toBe(`${NAME}('&/?')`);
    expect(testService.createKey({ userName: "&/?" }, true)).toBe(`${NAME}(UserName='&/?')`);
  });

  test("entitySet: parseKey", async () => {
    expect(testService.parseKey(`${NAME}('xxx')`)).toBe("xxx");
    expect(testService.parseKey(`${NAME}(UserName='xxx')`)).toStrictEqual({ userName: "xxx" });
  });

  test("entitySet: parseKey not decoding", async () => {
    expect(testService.parseKey(`${NAME}('&/?')`, true)).toBe("&/?");
    expect(testService.parseKey(`${NAME}(UserName='&/?')`, true)).toStrictEqual({ userName: "&/?" });
  });

  test("entitySet: query", async () => {
    const expected = `${EXPECTED_PATH}`;
    const expectedData = [
      {
        userName: "tester",
        Age: "14",
        FavFeature: Feature.Feature1,
      },
    ];

    odataClient.setCollectionResponse([
      {
        UserName: "tester",
        Age: 14,
        FavFeature: Feature.Feature1,
      },
    ]);
    let result = await testService.query();
    // @ts-ignore
    const resultData = result.data.d?.results || result.data.value;

    expect(odataClient.lastUrl).toBe(expected);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastRequestConfig).toBeUndefined();
    expect(odataClient.additionalHeaders).toStrictEqual(DEFAULT_HEADERS);
    expect(resultData).toStrictEqual(expectedData);

    await testService.query(undefined, REQUEST_CONFIG);
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
  });

  test("entitySet: query with select", async () => {
    const expected = `${EXPECTED_PATH}?${encodeURIComponent("$select")}=${encodeURIComponent("UserName,Age")}`;

    await testService.query((queryBuilder) => queryBuilder.select("userName", "Age"));

    expect(odataClient.lastUrl).toBe(expected);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("entitySet: query with qObject", async () => {
    const expected = `${EXPECTED_PATH}?${encodeURIComponent("$filter")}=${encodeURIComponent("Age gt 18")}`;

    await testService.query((queryBuilder, qObj) => queryBuilder.filter(qObj.Age.gt("18")));

    expect(odataClient.lastUrl).toBe(expected);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("entitySet: no url encoding", async () => {
    const toTest = new serviceConstructor(odataClient, BASE_URL, NAME, { noUrlEncoding: true });

    await toTest.query((qb, q) => qb.filter(q.userName.eq("2")));

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH + "?$filter=UserName eq '2'");
  });
}
