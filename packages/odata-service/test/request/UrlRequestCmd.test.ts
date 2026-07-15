import { HttpResponseModel, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { CollectionResponseConverterV4, ModelResponseConverterV4 } from "@odata2ts/odata-query-objects";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { RequestInfo, UrlRequestCmd } from "../../src";
import type { RequestCmd } from "../../src";
import { EditablePersonModel, Feature, PersonModel } from "../fixture/PersonModel";
import { qPersonV4 } from "../fixture/v4/QPersonV4";
import { MockClient } from "../mock/MockClient";

describe("UrlRequestCmd tests", () => {
  const DEFAULT_URL = "test/ing";
  const DEFAULT_ODATA_DATA = {
    UserName: "tester",
    Age: 14,
    FavFeature: "Feature1",
    Features: ["Feature1"],
  };
  const DEFAULT_USER_DATA: EditablePersonModel = {
    userName: "tester",
    age: "14",
    favFeature: Feature.Feature1,
    features: [Feature.Feature1],
  };
  const DEFAULT_HEADERS = { foo: "BAR" };

  let client: MockClient;

  beforeEach(() => {
    client = new MockClient(false);
  });

  test("base props", () => {
    const candidate = new UrlRequestCmd<MockClient, void>(client, ODataHttpMethods.Get, DEFAULT_URL);

    expect(candidate.getUrl()).toBe(DEFAULT_URL);
    expect(candidate.getInfo()).toMatchObject({
      method: ODataHttpMethods.Get,
      url: DEFAULT_URL,
      headers: undefined,
      data: undefined,
    });
    expectTypeOf(candidate.getInfo()).toEqualTypeOf<RequestInfo>();
    expect(candidate.getInfoConverted()).toStrictEqual(candidate.getInfo());
  });

  test("max props", () => {
    const candidate = new UrlRequestCmd<MockClient, ODataModelResponseV4<PersonModel>, EditablePersonModel>(
      client,
      ODataHttpMethods.Get,
      DEFAULT_URL,
      DEFAULT_USER_DATA,
      {
        headers: DEFAULT_HEADERS,
      },
    );

    expect(candidate.getUrl()).toBe(DEFAULT_URL);
    expect(candidate.getInfo()).toMatchObject({
      method: ODataHttpMethods.Get,
      url: DEFAULT_URL,
      headers: DEFAULT_HEADERS,
      data: DEFAULT_USER_DATA,
    });

    expectTypeOf(candidate.getInfo()).toEqualTypeOf<RequestInfo<EditablePersonModel>>();
  });

  test("with new url", () => {
    const newUrl = "/foo/bar/baz";
    const candidate = new UrlRequestCmd<MockClient, ODataModelResponseV4<PersonModel>, EditablePersonModel>(
      client,
      ODataHttpMethods.Get,
      DEFAULT_URL,
      DEFAULT_USER_DATA,
      {
        headers: DEFAULT_HEADERS,
      },
    );

    const newCandy = candidate.withUrl(newUrl);

    expectTypeOf(newCandy).toEqualTypeOf(candidate);

    expect(candidate.getUrl()).toBe(DEFAULT_URL);
    expect(newCandy.getUrl()).toBe(newUrl);
    expect(newCandy.getInfo()).toMatchObject({ ...candidate.getInfo(), url: newUrl });
  });

  test("execute", async () => {
    const candidate = new UrlRequestCmd<MockClient, void>(client, ODataHttpMethods.Get, DEFAULT_URL);

    const result = await candidate.execute();

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<void>>();

    expect(client.lastUrl).toBe(DEFAULT_URL);
    expect(client.lastOperation).toBe("GET");
    expect(client.lastData).toBeUndefined();
    expect(client.additionalHeaders).toBeUndefined();
    expect(client.lastRequestConfig).toBeUndefined();
  });

  test("execute: with headers & request config", async () => {
    const candidate = new UrlRequestCmd<MockClient, void>(client, ODataHttpMethods.Put, DEFAULT_URL, undefined, {
      headers: DEFAULT_HEADERS,
    });

    const requestConfig = { headers: { add: "plus" }, test: "ing" };
    await candidate.execute(requestConfig);

    expect(client.lastOperation).toBe("PUT");
    expect(client.lastData).toBeUndefined();
    expect(client.additionalHeaders).toStrictEqual(DEFAULT_HEADERS);
    expect(client.lastRequestConfig).toStrictEqual(requestConfig);
  });

  test("execute: with data", async () => {
    const candidate = new UrlRequestCmd<MockClient, void, EditablePersonModel>(
      client,
      ODataHttpMethods.Post,
      DEFAULT_URL,
      DEFAULT_USER_DATA,
    );

    const result = await candidate.execute();

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<void>>();

    expect(client.lastOperation).toBe("POST");
    expect(client.lastData).toStrictEqual(DEFAULT_USER_DATA);
  });

  test("execute: with data & main converter", async () => {
    const candidate = new UrlRequestCmd<MockClient, void, EditablePersonModel>(
      client,
      ODataHttpMethods.Delete,
      DEFAULT_URL,
      DEFAULT_USER_DATA,
      { mainRequestConverter: qPersonV4 },
    );

    const info = candidate.getInfo();
    const converted = candidate.getInfoConverted();

    expect(info.data).toStrictEqual(DEFAULT_USER_DATA);
    expect(converted).toStrictEqual(info.withData(DEFAULT_ODATA_DATA));

    await candidate.execute();

    expect(client.lastOperation).toBe("DELETE");
    expect(client.lastData).toStrictEqual(DEFAULT_ODATA_DATA);
  });

  test("execute: with data & prepended converter", async () => {
    const candidate = new UrlRequestCmd<MockClient, void, EditablePersonModel>(
      client,
      ODataHttpMethods.Post,
      DEFAULT_URL,
      DEFAULT_USER_DATA,
      { mainRequestConverter: qPersonV4 },
    ).prependRequestConverter((info) => new RequestInfo(info.method, "NEW", info.headers, info.data));

    const info = candidate.getInfo();
    const converted = candidate.getInfoConverted();

    expect(info.url).toBe(DEFAULT_URL);
    expect(converted.url).toBe("NEW");

    await candidate.execute();

    expect(client.lastUrl).toBe("NEW");
    expect(client.lastData).toStrictEqual(DEFAULT_ODATA_DATA);
  });

  test("execute: with data & appended converter", async () => {
    const candidate = new UrlRequestCmd<MockClient, void, EditablePersonModel>(
      client,
      ODataHttpMethods.Get,
      DEFAULT_URL,
      DEFAULT_USER_DATA,
    ).appendRequestConverter((info) => new RequestInfo(info.method, "NEW", info.headers, info.data));

    await candidate.execute();

    expect(candidate.getInfoConverted().url).toBe("NEW");
    expect(client.lastUrl).toBe("NEW");
    expect(client.lastData).toStrictEqual(DEFAULT_USER_DATA);
  });

  test("execute: with response", async () => {
    const candidate = new UrlRequestCmd<MockClient, ODataModelResponseV4<PersonModel>>(
      client,
      ODataHttpMethods.Patch,
      DEFAULT_URL,
    );

    // we respond with the converted model
    client.responseData = DEFAULT_USER_DATA;
    const result = await candidate.execute();

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<PersonModel>>>();

    expect(client.lastOperation).toBe("PATCH");
    expect(result.data).toStrictEqual(DEFAULT_USER_DATA);
  });

  test("execute: with response & converter", async () => {
    const candidate = new UrlRequestCmd<MockClient, ODataModelResponseV4<PersonModel>>(
      client,
      ODataHttpMethods.Post,
      DEFAULT_URL,
      undefined,
      {
        mainResponseConverter: new ModelResponseConverterV4<PersonModel>(qPersonV4),
      },
    );

    // we respond with the odata facing model
    const metadata = { "@odata.type": "testing", "@odata.id": "bar" };
    client.responseData = { ...DEFAULT_ODATA_DATA, ...metadata };
    const result = await candidate.execute();

    // and expect the converted model back
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<PersonModel>>>();

    expect(result.data).toStrictEqual({ ...DEFAULT_USER_DATA, ...metadata });
  });

  test("execute: with response & prepended converter", async () => {
    const candidate = new UrlRequestCmd<MockClient, ODataModelResponseV4<PersonModel>>(
      client,
      ODataHttpMethods.Post,
      DEFAULT_URL,
      undefined,
      {
        mainResponseConverter: new ModelResponseConverterV4<PersonModel>(qPersonV4),
      },
    ).prependResponseConverter((response) => ({ ...response, status: 666 }));

    // we respond with the odata facing model
    client.responseData = DEFAULT_ODATA_DATA;
    const result = await candidate.execute();

    // and expect the converted model back
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<PersonModel>>>();

    expect(result.status).toBe(666);
    expect(result.data).toStrictEqual(DEFAULT_USER_DATA);
  });

  test("execute: with response & appended converter", async () => {
    const candidate = new UrlRequestCmd<MockClient, ODataModelResponseV4<PersonModel>>(
      client,
      ODataHttpMethods.Post,
      DEFAULT_URL,
    ).appendResponseConverter<{ x: PersonModel }>((response) => ({ ...response, data: { x: response.data } }));

    // we respond with the odata facing model
    client.responseData = DEFAULT_ODATA_DATA;
    const result = await candidate.execute();

    // and expect the converted model back
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<{ x: PersonModel }>>();

    expect(result.data).toStrictEqual({ x: DEFAULT_ODATA_DATA });
  });

  test("execute: combined features", async () => {
    const candidate = new UrlRequestCmd<MockClient, ODataCollectionResponseV4<PersonModel>, EditablePersonModel>(
      client,
      ODataHttpMethods.Post,
      DEFAULT_URL,
      DEFAULT_USER_DATA,
      {
        headers: DEFAULT_HEADERS,
        mainRequestConverter: qPersonV4,
        mainResponseConverter: new CollectionResponseConverterV4<PersonModel>(qPersonV4),
      },
    )
      .prependRequestConverter(({ method, data, headers }) => new RequestInfo(method, "NEW", headers, data))
      .appendRequestConverter((info) => info.withData({ z: "y", ...info.data }))
      .prependResponseConverter((response) => ({ ...response, status: 999 }))
      .appendResponseConverter<{ x: ODataCollectionResponseV4<PersonModel> }>((response) => ({
        ...response,
        data: { x: response.data, y: "z" },
      }));

    expectTypeOf(candidate).toEqualTypeOf<
      RequestCmd<
        MockClient,
        ODataCollectionResponseV4<PersonModel>,
        EditablePersonModel,
        { x: ODataCollectionResponseV4<PersonModel> }
      >
    >();

    expect(candidate.getInfoConverted()).toMatchObject({
      method: "POST",
      url: "NEW",
      headers: DEFAULT_HEADERS,
      data: { z: "y", ...DEFAULT_ODATA_DATA },
    });

    client.responseData = { value: [DEFAULT_ODATA_DATA, DEFAULT_ODATA_DATA] };
    const result = await candidate.execute();

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<{ x: ODataCollectionResponseV4<PersonModel> }>>();

    expect(result).toStrictEqual({
      status: 999,
      statusText: "OK",
      headers: {},
      data: {
        x: {
          value: [DEFAULT_USER_DATA, DEFAULT_USER_DATA],
        },
        y: "z",
      },
    });
  });
});
