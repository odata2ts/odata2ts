import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ModelResponseConverterV4 } from "@odata2ts/odata-query-objects";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { ComposableUrlRequestCmd, UrlBuilderRequestCmdV4 } from "../../src";
import { Feature, PersonModel } from "../fixture/PersonModel";
import { PersonModelService } from "../fixture/v4/PersonModelService";
import { QPersonV4 } from "../fixture/v4/QPersonV4";
import { MockClient } from "../mock/MockClient";

describe("ComposableUrlRequestCmd tests", () => {
  const DEFAULT_URL = "/test/ing";
  const DEFAULT_HEADERS = { x: "y" };

  let client: MockClient;
  let candidate: ComposableUrlRequestCmd<MockClient, PersonModelService<MockClient>, ODataModelResponseV4<PersonModel>>;

  beforeEach(() => {
    client = new MockClient(false);
    candidate = new ComposableUrlRequestCmd<
      MockClient,
      PersonModelService<MockClient>,
      ODataModelResponseV4<PersonModel>
    >(client, DEFAULT_URL, (url: string) => new PersonModelService(client, url, "", { noUrlEncoding: true }), {
      headers: DEFAULT_HEADERS,
      mainResponseConverter: new ModelResponseConverterV4(new QPersonV4()),
    });
  });

  test("base props", () => {
    expect(candidate.getUrl()).toBe(DEFAULT_URL);
    expect(candidate.getInfo().url).toBe(DEFAULT_URL);
  });

  test("with new URL", () => {
    const newUrl = "hey/ho/there";
    const newCandidate = candidate.withUrl(newUrl);

    expect(candidate.getUrl()).toBe(DEFAULT_URL);
    expect(newCandidate.getUrl()).toBe(newUrl);
    expect(newCandidate.getInfo()).toMatchObject({ ...candidate.getInfo(), url: newUrl });
  });

  test("execute", async () => {
    client.responseData = {
      UserName: "tester",
      Age: 14,
      FavFeature: "Feature1",
      Features: ["Feature1"],
    };

    const requestConfig = { headers: { x: "y" }, test: "ing" };
    const result = await candidate.appendRequestConverter((info) => info.withData("test")).execute(requestConfig);

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<PersonModel>>>();

    expect(client.lastUrl).toBe(DEFAULT_URL);
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

  test("compose: direct select query", () => {
    const cmd = candidate.compose().query((builder) => builder.select("age", "userName"));

    expectTypeOf(cmd).toEqualTypeOf<UrlBuilderRequestCmdV4<MockClient, ODataModelResponseV4<PersonModel>, QPersonV4>>();

    expect(cmd.getUrl()).toStrictEqual(`${DEFAULT_URL}?$select=Age,UserName`);
  });

  test("compose: path navigation & query", () => {
    const cmd = candidate.compose().friends.query((builder) => builder.select("age", "userName"));

    expectTypeOf(cmd).toEqualTypeOf<
      UrlBuilderRequestCmdV4<MockClient, ODataCollectionResponseV4<PersonModel>, QPersonV4>
    >();

    expect(cmd.getUrl()).toStrictEqual(`${DEFAULT_URL}/Friends?$select=Age,UserName`);
  });
});
