import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2 } from "@odata2ts/odata-core";
import { EnumCollection, QEnumCollection, QStringV2Collection, StringCollection } from "@odata2ts/odata-query-objects";

import { CollectionServiceV2 } from "../../src";
import { commonCollectionTests, getParams } from "../CollectionServiceTests";
import { Feature } from "../fixture/PersonModel";
import { MockClient } from "../mock/MockClient";

describe("CollectionService V2 Tests", () => {
  const odataClient = new MockClient(true);
  const BASE_PATH = "";
  const NAME_STRING = "testString";
  const NAME_ENUM = "testEnum";

  const stringConstructor = (
    basePath: string,
    name: string
  ): CollectionServiceV2<MockClient, StringCollection, QStringV2Collection> => {
    return new CollectionServiceV2(odataClient, basePath, name, new QStringV2Collection());
  };
  const enumConstructor = (
    basePath: string,
    name: string
  ): CollectionServiceV2<MockClient, EnumCollection<Feature>, QEnumCollection> => {
    return new CollectionServiceV2(odataClient, basePath, name, new QEnumCollection());
  };

  commonCollectionTests(odataClient, stringConstructor, enumConstructor);

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
