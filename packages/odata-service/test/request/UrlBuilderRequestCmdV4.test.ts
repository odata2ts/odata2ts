import { HttpResponseModel, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { CollectionQueryBuilderV4, createQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { ModelResponseConverterV4 } from "@odata2ts/odata-query-objects";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { DEFAULT_HEADERS, UrlBuilderRequestCmdV4 } from "../../src";
import { Feature, PersonModel } from "../fixture/PersonModel";
import { QPersonV4, qPersonV4 } from "../fixture/v4/QPersonV4";
import { MockClient } from "../mock/MockClient";

describe("UrlBuilderRequestCmdV4 tests", () => {
  const DEFAULT_URL = "/test/ing";

  let client: MockClient;
  let queryBuilder: CollectionQueryBuilderV4<QPersonV4>;

  beforeEach(() => {
    client = new MockClient(false);
    queryBuilder = createQueryBuilderV4(DEFAULT_URL, qPersonV4, { unencoded: true });
  });

  test("base props", () => {
    const candidate = new UrlBuilderRequestCmdV4(client, queryBuilder, qPersonV4);

    expect(candidate.getUrl()).toBe(DEFAULT_URL);
    expect(candidate.getInfo().url).toBe(DEFAULT_URL);
  });

  test("defaults to GET with no data when no method/data option is given", () => {
    const candidate = new UrlBuilderRequestCmdV4(client, queryBuilder, qPersonV4);

    expect(candidate.getInfo().method).toBe(ODataHttpMethods.Get);
    expect(candidate.getInfo().data).toBeUndefined();
  });

  test("carries an explicit method and data payload, e.g. for a write operation", () => {
    const candidate = new UrlBuilderRequestCmdV4<
      MockClient,
      undefined,
      QPersonV4,
      CollectionQueryBuilderV4<QPersonV4>,
      PersonModel
    >(client, queryBuilder, qPersonV4, { method: ODataHttpMethods.Put, data: { userName: "tester" } as PersonModel });

    expect(candidate.getInfo().method).toBe(ODataHttpMethods.Put);
    expect(candidate.getInfo().data).toStrictEqual({ userName: "tester" });
  });

  test("addToQuery on a write Cmd keeps method and data intact", () => {
    const candidate = new UrlBuilderRequestCmdV4<
      MockClient,
      undefined,
      QPersonV4,
      CollectionQueryBuilderV4<QPersonV4>,
      PersonModel
    >(client, queryBuilder, qPersonV4, { method: ODataHttpMethods.Put, data: { userName: "tester" } as PersonModel });
    const newCandidate = candidate.addToQuery((builder) => builder.select("age"));

    expect(newCandidate.getUrl()).toBe(DEFAULT_URL + "?$select=Age");
    expect(newCandidate.getInfo().method).toBe(ODataHttpMethods.Put);
    expect(newCandidate.getInfo().data).toStrictEqual({ userName: "tester" });
  });

  test("add to query", () => {
    const candidate = new UrlBuilderRequestCmdV4(client, queryBuilder, qPersonV4);
    const newCandidate = candidate.addToQuery((builder) => builder.select("userName"));

    expect(candidate.getUrl()).toBe(DEFAULT_URL);
    expect(newCandidate.getInfo()).toMatchObject({ ...candidate.getInfo(), url: DEFAULT_URL + "?$select=UserName" });
  });

  test("add to query multiple times", () => {
    const candidate = new UrlBuilderRequestCmdV4(client, queryBuilder, qPersonV4);
    const newCandidate = candidate
      .addToQuery((builder) => builder.select("userName"))
      .addToQuery((builder, qPerson) => builder.filter(qPerson.age.gt("40")));

    expect(newCandidate.getUrl()).toBe(DEFAULT_URL + "?$select=UserName&$filter=Age gt 40");
  });

  test("execute", async () => {
    const candidate = new UrlBuilderRequestCmdV4<MockClient, ODataModelResponseV4<PersonModel>, QPersonV4>(
      client,
      queryBuilder,
      qPersonV4,
      {
        headers: DEFAULT_HEADERS,
        mainResponseConverter: new ModelResponseConverterV4(qPersonV4),
      },
    );

    client.responseData = {
      UserName: "tester",
      Age: 14,
      FavFeature: "Feature1",
      Features: ["Feature1"],
    };

    const requestConfig = { headers: { x: "y" }, test: "ing" };
    const result = await candidate
      .addToQuery((builder, qPerson) => builder.filter(qPerson.age.gt("40")))
      .appendRequestConverter((info) => info.withData("test"))
      .execute(requestConfig);

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<PersonModel>>>();

    expect(client.lastUrl).toBe(DEFAULT_URL + "?$filter=Age gt 40");
    expect(client.lastData).toBe("test");
    expect(client.additionalHeaders).toStrictEqual(DEFAULT_HEADERS);
    expect(client.lastRequestConfig).toStrictEqual(requestConfig);

    expect(result.data).toStrictEqual({
      userName: "tester",
      age: "14",
      favFeature: Feature.Feature1,
      features: [Feature.Feature1],
    });
  });

  test("as POST request", () => {
    const candidate = new UrlBuilderRequestCmdV4<MockClient, ODataModelResponseV4<PersonModel>, QPersonV4>(
      client,
      queryBuilder,
      qPersonV4,
      {
        headers: DEFAULT_HEADERS,
        mainResponseConverter: new ModelResponseConverterV4(qPersonV4),
      },
    ).addToQuery((builder) => builder.select("userName"));

    expect(candidate.asPostRequest().getInfoConverted()).toMatchObject({
      method: "POST",
      url: DEFAULT_URL + "/$query",
      headers: { "Content-Type": "text/plain" },
      data: "$select=UserName",
    });
  });
});
