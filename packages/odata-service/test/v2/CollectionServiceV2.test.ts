import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2 } from "@odata2ts/odata-core";
import {
  EnumCollection,
  QNumericEnumCollection,
  QStringV2Collection,
  StringCollection,
} from "@odata2ts/odata-query-objects";
import { describe, expect, test } from "vitest";
import { CollectionServiceV2, ODataServiceOptions } from "../../src";
import { DEFAULT_HEADERS } from "../../src/RequestHeaders";
import { commonCollectionTests, getParams } from "../CollectionServiceTests";
import { MockClient } from "../mock/MockClient";
import { StringTestEnum } from "../v4/CollectionServiceV4.test";

export enum NumericTestEnum {
  A,
  B,
  ZEBRA = 99,
}

describe("CollectionService V2 Tests", () => {
  const odataClient = new MockClient(true);
  const BASE_PATH = "";
  const NAME_STRING = "testString";
  const NAME_ENUM = "testEnum";

  const stringConstructor = (
    basePath: string,
    name: string,
    options?: ODataServiceOptions,
  ): CollectionServiceV2<MockClient, StringCollection, QStringV2Collection> => {
    return new CollectionServiceV2(odataClient, basePath, name, new QStringV2Collection(), options);
  };
  const enumConstructor = (
    basePath: string,
    name: string,
  ): CollectionServiceV2<
    MockClient,
    EnumCollection<NumericTestEnum>,
    QNumericEnumCollection<typeof NumericTestEnum>
  > => {
    return new CollectionServiceV2(odataClient, basePath, name, new QNumericEnumCollection(NumericTestEnum));
  };

  commonCollectionTests(odataClient, stringConstructor, enumConstructor);

  test("numeric enum collection: add", async () => {
    const REQUEST_CONFIG = { test: "Test" };

    const enumService = enumConstructor(BASE_PATH, NAME_ENUM);

    await enumService.add(NumericTestEnum.A, REQUEST_CONFIG);

    expect(odataClient.lastUrl).toBe(NAME_ENUM);
    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastData).toEqual(NumericTestEnum[NumericTestEnum.A]);
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
    expect(odataClient.additionalHeaders).toStrictEqual(DEFAULT_HEADERS);
  });

  test("numeric enum collection: filter", async () => {
    const params = getParams({ $filter: "($it eq 'A' or $it eq 'B')" });

    const enumService = enumConstructor(BASE_PATH, NAME_ENUM);

    await enumService.query((queryBuilder, qObj) =>
      queryBuilder.filter(qObj.it.eq(NumericTestEnum.A).or(qObj.it.eq(1))),
    );
    expect(odataClient.lastUrl).toBe(NAME_ENUM + params);
  });

  test("collection: query response typing test", async () => {
    const stringService = stringConstructor(BASE_PATH, NAME_STRING);
    const enumService = enumConstructor(BASE_PATH, NAME_ENUM);

    // typing tests
    const result: HttpResponseModel<ODataCollectionResponseV2<string>> = await stringService.query();
    const resultEnum: HttpResponseModel<ODataCollectionResponseV2<string>> = await enumService.query();
    const result2: HttpResponseModel<ODataCollectionResponseV2<number>> = await enumService.query<number>();
  });

  test("collection: count", async () => {
    const stringService = stringConstructor(BASE_PATH, NAME_STRING);
    const params = getParams({ $inlinecount: "allpages" });
    const expected = "testString" + params;

    await stringService.query((builder) => builder.count());

    expect(odataClient.lastUrl).toBe(expected);
  });
});
