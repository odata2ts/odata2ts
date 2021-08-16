import { qStringCollection, StringCollection, qEnumCollection, EnumCollection } from "@odata2ts/odata-query-objects";
import { CollectionService } from "../src";
import { MockODataClient } from "../../odata2model/test/MockODataClient";
import { Feature, PersonModel } from "./fixture/PersonModelService";

describe("CollectionService Test", () => {
  const odataClient = new MockODataClient();
  const BASE_URL = "/test";
  const STRING_URL = `${BASE_URL}/Name`;
  const ENUM_URL = `${BASE_URL}/Feature`;

  let stringService: CollectionService<StringCollection>;
  let enumService: CollectionService<EnumCollection<Feature>>;

  const getParams = (params: { [key: string]: string }) => {
    const ps = Object.entries(params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    return `?${ps.join("&")}`;
  };

  beforeEach(() => {
    stringService = new CollectionService(odataClient, STRING_URL, qStringCollection);
    enumService = new CollectionService(odataClient, ENUM_URL, qEnumCollection);
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

  test("collection: skip, top, count & but no select, expand", async () => {
    const params = getParams({ $skip: "1", $top: "2", $count: "true" });
    const expectedString = STRING_URL + params;
    const expectedEnum = ENUM_URL + params;

    await stringService.query((queryBuilder) => {
      expect(queryBuilder.select).toBeUndefined;
      expect(queryBuilder.expand).toBeUndefined;
      expect(queryBuilder.expanding).toBeUndefined;

      queryBuilder.skip(1).top(2).count(true);
    });

    expect(odataClient.lastUrl).toBe(expectedString);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");

    await enumService.query((queryBuilder) => {
      expect(queryBuilder.select).toBeUndefined;
      expect(queryBuilder.expand).toBeUndefined;
      expect(queryBuilder.expanding).toBeUndefined;

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
    const model: PersonModel = {
      UserName: "tester",
      Age: 14,
      FavFeature: Feature.Feature1,
      Features: [Feature.Feature1],
      Friends: [],
    };
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
    expect(stringService.patch).toBeUndefined;
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
