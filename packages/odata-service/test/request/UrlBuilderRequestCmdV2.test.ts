import { HttpResponseModel, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataEntityModelResponseV2 } from "@odata2ts/odata-core";
import { CollectionQueryBuilderV2, createQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import { EntityResponseConverterV2 } from "@odata2ts/odata-query-objects";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { DEFAULT_HEADERS, UrlBuilderRequestCmdV2 } from "../../src";
import { Feature, PersonModel } from "../fixture/PersonModel";
import { qPersonV2, QPersonV2 } from "../fixture/v2/QPersonV2";
import { MockClient } from "../mock/MockClient";

describe("UrlBuilderRequestCmd tests", () => {
  const DEFAULT_URL = "/test/ing";

  let client: MockClient;
  let queryBuilder: CollectionQueryBuilderV2<QPersonV2>;

  beforeEach(() => {
    client = new MockClient(false);
    queryBuilder = createQueryBuilderV2(DEFAULT_URL, qPersonV2, { unencoded: true });
  });

  test("base props", () => {
    const candidate = new UrlBuilderRequestCmdV2(client, ODataHttpMethods.Get, queryBuilder, qPersonV2);

    expect(candidate.getUrl()).toBe(DEFAULT_URL);
    expect(candidate.getInfo().url).toBe(DEFAULT_URL);
  });

  test("defaults to no data when no data param is given", () => {
    const candidate = new UrlBuilderRequestCmdV2(client, ODataHttpMethods.Get, queryBuilder, qPersonV2);

    expect(candidate.getInfo().method).toBe(ODataHttpMethods.Get);
    expect(candidate.getInfo().data).toBeUndefined();
  });

  test("carries an explicit method and data payload, e.g. for a write operation", () => {
    const candidate = new UrlBuilderRequestCmdV2<
      MockClient,
      undefined,
      QPersonV2,
      CollectionQueryBuilderV2<QPersonV2>,
      PersonModel
    >(client, ODataHttpMethods.Put, queryBuilder, qPersonV2, { userName: "tester" } as PersonModel);

    expect(candidate.getInfo().method).toBe(ODataHttpMethods.Put);
    expect(candidate.getInfo().data).toStrictEqual({ userName: "tester" });
  });

  test("addToQuery on a write Cmd keeps method and data intact", () => {
    const candidate = new UrlBuilderRequestCmdV2<
      MockClient,
      undefined,
      QPersonV2,
      CollectionQueryBuilderV2<QPersonV2>,
      PersonModel
    >(client, ODataHttpMethods.Put, queryBuilder, qPersonV2, { userName: "tester" } as PersonModel);
    const newCandidate = candidate.addToQuery((builder) => builder.select("age"));

    expect(newCandidate.getUrl()).toBe(DEFAULT_URL + "?$select=Age");
    expect(newCandidate.getInfo().method).toBe(ODataHttpMethods.Put);
    expect(newCandidate.getInfo().data).toStrictEqual({ userName: "tester" });
  });

  test("add to query: guard against missing modification function", () => {
    const candidate = new UrlBuilderRequestCmdV2(client, ODataHttpMethods.Get, queryBuilder, qPersonV2);

    expect(() => candidate.addToQuery(undefined as any)).toThrow(
      "changeUrl requires the modification function as first argument!",
    );
  });

  test("add to query", () => {
    const candidate = new UrlBuilderRequestCmdV2(client, ODataHttpMethods.Get, queryBuilder, qPersonV2);
    const newCandidate = candidate.addToQuery((builder) => builder.select("userName"));

    expect(candidate.getUrl()).toBe(DEFAULT_URL);
    expect(newCandidate.getInfo()).toMatchObject({ ...candidate.getInfo(), url: DEFAULT_URL + "?$select=UserName" });
  });

  test("new URL multiple times", () => {
    const candidate = new UrlBuilderRequestCmdV2(client, ODataHttpMethods.Get, queryBuilder, qPersonV2);
    const newCandidate = candidate
      .addToQuery((builder, qPerson) => builder.select("userName"))
      .addToQuery((builder, qPerson) => builder.filter(qPerson.age.gt("40")));

    expect(newCandidate.getUrl()).toBe(DEFAULT_URL + "?$select=UserName&$filter=Age gt 40");
  });

  test("execute", async () => {
    const candidate = new UrlBuilderRequestCmdV2<MockClient, ODataEntityModelResponseV2<PersonModel>, QPersonV2>(
      client,
      ODataHttpMethods.Get,
      queryBuilder,
      qPersonV2,
      undefined,
      {
        headers: DEFAULT_HEADERS,
        mainResponseConverter: new EntityResponseConverterV2(qPersonV2),
      },
    );

    client.responseData = {
      d: {
        UserName: "tester",
        Age: 14,
        FavFeature: "Feature1",
        Features: ["Feature1"],
      },
    };

    const requestConfig = { headers: { x: "y" }, test: "ing" };
    const result = await candidate
      .addToQuery((builder, qPerson) => builder.filter(qPerson.age.gt("40")))
      .appendRequestConverter((info) => info.withData("test"))
      .execute(requestConfig);

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataEntityModelResponseV2<PersonModel>>>();

    expect(client.lastUrl).toBe(DEFAULT_URL + "?$filter=Age gt 40");
    expect(client.lastData).toBe("test");
    expect(client.additionalHeaders).toStrictEqual(DEFAULT_HEADERS);
    expect(client.lastRequestConfig).toStrictEqual(requestConfig);

    expect(result.data.d).toStrictEqual({
      userName: "tester",
      age: "14",
      favFeature: Feature.Feature1,
      features: [Feature.Feature1],
    });
  });
});
