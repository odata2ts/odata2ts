import { MockODataClient } from "./mock/MockODataClient";
import {
  EnumCollectionService,
  EnumCollectionServiceConstructor,
  Feature,
  StringCollectionService,
  StringCollectionServiceConstructor,
} from "./fixture/PersonModel";

export function getParams(params: { [key: string]: string }) {
  const ps = Object.entries(params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  return `?${ps.join("&")}`;
}

export function commonCollectionTests(
  odataClient: MockODataClient,
  stringCollectionServiceConstructor: StringCollectionServiceConstructor,
  enumCollectionServiceConstructor: EnumCollectionServiceConstructor
) {
  const BASE_URL = "/test";
  const STRING_URL = `${BASE_URL}/Name`;
  const ENUM_URL = `${BASE_URL}/Feature`;
  const REQUEST_CONFIG = { test: "Test" };

  let stringService: StringCollectionService;
  let enumService: EnumCollectionService;

  beforeEach(() => {
    stringService = stringCollectionServiceConstructor(STRING_URL);
    enumService = enumCollectionServiceConstructor(ENUM_URL);
  });

  test("collection: query", async () => {
    await stringService.query();
    expect(odataClient.lastUrl).toBe(STRING_URL);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastRequestConfig).toBeUndefined();

    await enumService.query(undefined, REQUEST_CONFIG);
    expect(odataClient.lastUrl).toBe(ENUM_URL);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
  });

  test("collection: skip & top, but no select, expand", async () => {
    const params = getParams({ $top: "2", $skip: "1" });
    const expectedString = STRING_URL + params;
    const expectedEnum = ENUM_URL + params;

    await stringService.query((queryBuilder) => {
      queryBuilder.skip(1).top(2);
    });

    expect(odataClient.lastUrl).toBe(expectedString);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");

    await enumService.query((queryBuilder) => {
      queryBuilder.skip(1).top(2);
    });

    expect(odataClient.lastUrl).toBe(expectedEnum);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("collection: filter", async () => {
    const params = getParams({ $filter: "$it eq 'hi'" });
    const expectedString = STRING_URL + params;
    const expectedEnum = ENUM_URL + params;

    await stringService.query((queryBuilder, qObj) => queryBuilder.filter(qObj.it.eq("hi")));
    expect(odataClient.lastUrl).toBe(expectedString);

    await enumService.query((queryBuilder, qObj) => queryBuilder.filter(qObj.it.eq("hi")));
    expect(odataClient.lastUrl).toBe(expectedEnum);
  });

  test("collection: add", async () => {
    await stringService.add("test");

    expect(odataClient.lastUrl).toBe(STRING_URL);
    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastData).toEqual("test");
    expect(odataClient.lastRequestConfig).toBeUndefined();

    await enumService.add(Feature.Feature1, REQUEST_CONFIG);

    expect(odataClient.lastUrl).toBe(ENUM_URL);
    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastData).toEqual(Feature.Feature1);
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
  });

  test("collection: no patch", async () => {
    // @ts-expect-error
    expect(stringService.patch).toBeUndefined();
  });

  test("collection: update", async () => {
    const model = ["test1", "t2"];
    await stringService.update(model);

    expect(odataClient.lastUrl).toBe(STRING_URL);
    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastData).toEqual(model);
    expect(odataClient.lastRequestConfig).toBeUndefined();

    await stringService.update(model, REQUEST_CONFIG);
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
  });

  test("collection: delete", async () => {
    await stringService.delete();

    expect(odataClient.lastUrl).toBe(STRING_URL);
    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastRequestConfig).toBeUndefined();

    await stringService.delete(REQUEST_CONFIG);
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
  });
}
