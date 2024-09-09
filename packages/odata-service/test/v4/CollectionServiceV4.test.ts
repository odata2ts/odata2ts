import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4 } from "@odata2ts/odata-core";
import { EnumCollection, QEnumCollection, QStringCollection, StringCollection } from "@odata2ts/odata-query-objects";
import { describe, expect, test } from "vitest";
import { CollectionServiceV4 } from "../../src";
import { DEFAULT_HEADERS } from "../../src/RequestHeaders";
import { commonCollectionTests, getParams } from "../CollectionServiceTests";
import { MockClient } from "../mock/MockClient";

export enum StringTestEnum {
  A = "A",
  B = "B",
  ZEBRA = "ZEBRA",
}

describe("CollectionService V4 Tests", () => {
  const odataClient = new MockClient(false);
  const BASE_PATH = "";
  const NAME_STRING = "testString";
  const NAME_ENUM = "testEnum";

  const stringConstructor = (
    basePath: string,
    name: string,
  ): CollectionServiceV4<MockClient, StringCollection, QStringCollection> => {
    return new CollectionServiceV4(odataClient, basePath, name, new QStringCollection());
  };
  const enumConstructor = (
    basePath: string,
    name: string,
  ): CollectionServiceV4<MockClient, EnumCollection<StringTestEnum>, QEnumCollection<typeof StringTestEnum>> => {
    return new CollectionServiceV4(odataClient, basePath, name, new QEnumCollection(StringTestEnum));
  };

  commonCollectionTests(odataClient, stringConstructor, enumConstructor);

  test("string enum collection: add", async () => {
    const REQUEST_CONFIG = { test: "Test" };

    const enumService = enumConstructor(BASE_PATH, NAME_ENUM);

    await enumService.add(StringTestEnum.A, REQUEST_CONFIG);

    expect(odataClient.lastUrl).toBe(NAME_ENUM);
    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastData).toEqual(StringTestEnum.A);
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
    expect(odataClient.additionalHeaders).toStrictEqual(DEFAULT_HEADERS);
  });

  test("string enum collection: filter", async () => {
    const params = getParams({ $filter: "($it eq 'A' or $it eq 'B')" });

    const enumService = enumConstructor(BASE_PATH, NAME_ENUM);

    await enumService.query((queryBuilder, qObj) =>
      queryBuilder.filter(qObj.it.eq(StringTestEnum.A).or(qObj.it.eq("B"))),
    );
    expect(odataClient.lastUrl).toBe(NAME_ENUM + params);
  });

  test("colleciton: big number", async () => {
    const testService = new CollectionServiceV4(odataClient, BASE_PATH, NAME_STRING, new QStringCollection(), true);

    await testService.query();

    expect(odataClient.additionalHeaders).toStrictEqual({
      Accept: "application/json;IEEE754Compatible=true",
      "Content-Type": "application/json;IEEE754Compatible=true",
    });
  });

  test("collection: query typing", async () => {
    const stringService = stringConstructor(BASE_PATH, NAME_STRING);
    const enumService = enumConstructor(BASE_PATH, NAME_ENUM);

    const result: HttpResponseModel<ODataCollectionResponseV4<string>> = await stringService.query();
    const resultEnum: HttpResponseModel<ODataCollectionResponseV4<string>> = await enumService.query();
    const result2: HttpResponseModel<ODataCollectionResponseV4<number>> = await enumService.query<number>();
  });

  test("collection: count", async () => {
    const stringService = stringConstructor(BASE_PATH, NAME_STRING);
    const params = getParams({ $count: "true" });
    const expected = "testString" + params;

    await stringService.query((builder) => builder.count());

    expect(odataClient.lastUrl).toBe(expected);
  });
});
