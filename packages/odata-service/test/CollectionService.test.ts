import { QStringCollection, StringCollection, QEnumCollection, EnumCollection } from "@odata2ts/odata-query-objects";
import { CollectionServiceV4 } from "../src";
import { MockODataClient } from "./mock/MockODataClient";
import { Feature } from "./fixture/PersonModelService";

describe("CollectionService Test", () => {
  const odataClient = new MockODataClient();
  const BASE_URL = "/test";
  const STRING_URL = `${BASE_URL}/Name`;
  const ENUM_URL = `${BASE_URL}/Feature`;

  let stringService: CollectionServiceV4<StringCollection, QStringCollection>;
  let enumService: CollectionServiceV4<EnumCollection<Feature>, QEnumCollection>;

  const getParams = (params: { [key: string]: string }) => {
    const ps = Object.entries(params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    return `?${ps.join("&")}`;
  };

  beforeEach(() => {
    stringService = new CollectionServiceV4(odataClient, STRING_URL, new QStringCollection());
    enumService = new CollectionServiceV4(odataClient, ENUM_URL, new QEnumCollection());
  });

  test("collection: query", async () => {
    await stringService.query();
    expect(odataClient.lastUrl).toBe(STRING_URL);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");

    await enumService.query();
    expect(odataClient.lastUrl).toBe(ENUM_URL);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
  });

  test("collection: skip, top & count, but no select, expand", async () => {
    const params = getParams({ $skip: "1", $top: "2", $count: "true" });
    const expectedString = STRING_URL + params;
    const expectedEnum = ENUM_URL + params;

    await stringService.query((queryBuilder) => {
      queryBuilder.skip(1).top(2).count(true);
    });

    expect(odataClient.lastUrl).toBe(expectedString);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");

    await enumService.query((queryBuilder) => {
      queryBuilder.skip(1).top(2).count(true);
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

    await enumService.add(Feature.Feature1);

    expect(odataClient.lastUrl).toBe(ENUM_URL);
    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastData).toEqual(Feature.Feature1);
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
  });

  test("collection: delete", async () => {
    await stringService.delete();

    expect(odataClient.lastUrl).toBe(STRING_URL);
    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastData).toBeUndefined();
  });
});
