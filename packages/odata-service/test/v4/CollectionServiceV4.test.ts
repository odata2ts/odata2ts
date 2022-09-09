import { HttpResponseModel } from "@odata2ts/odata-client-api";
import { EnumCollection, QEnumCollection, QStringCollection, StringCollection } from "@odata2ts/odata-query-objects";

import { CollectionServiceV4, ODataCollectionResponseV4 } from "../../src";
import { commonCollectionTests, getParams } from "../CollectionServiceTests";
import { Feature } from "../fixture/PersonModel";
import { MockODataClient } from "../mock/MockODataClient";

describe("CollectionService V4 Tests", () => {
  const odataClient = new MockODataClient();
  const BASE_PATH = "";
  const NAME_STRING = "testString";
  const NAME_ENUM = "testEnum";

  const stringConstructor = (
    basePath: string,
    name: string
  ): CollectionServiceV4<MockODataClient, StringCollection, QStringCollection> => {
    return new CollectionServiceV4(odataClient, basePath, name, new QStringCollection());
  };
  const enumConstructor = (
    basePath: string,
    name: string
  ): CollectionServiceV4<MockODataClient, EnumCollection<Feature>, QEnumCollection> => {
    return new CollectionServiceV4(odataClient, basePath, name, new QEnumCollection());
  };

  commonCollectionTests(odataClient, stringConstructor, enumConstructor);

  test("collection: query typing", async () => {
    const stringService = stringConstructor(BASE_PATH, NAME_STRING);
    const enumService = enumConstructor(BASE_PATH, NAME_ENUM);

    const result: HttpResponseModel<ODataCollectionResponseV4<StringCollection>> = await stringService.query();
    const resultEnum: HttpResponseModel<ODataCollectionResponseV4<StringCollection>> = await enumService.query();
  });

  test("collection: count", async () => {
    const stringService = stringConstructor(BASE_PATH, NAME_STRING);
    const params = getParams({ $count: "true" });
    const expected = "testString" + params;

    await stringService.query((builder) => builder.count());

    expect(odataClient.lastUrl).toBe(expected);
  });
});
