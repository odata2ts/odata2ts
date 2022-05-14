import { HttpResponseModel } from "@odata2ts/odata-client-api";
import {
  QStringCollection,
  StringCollection,
  QEnumCollection,
  EnumCollection,
  QStringV2Collection,
} from "@odata2ts/odata-query-objects";

import { MockODataClient } from "../mock/MockODataClient";
import { CollectionServiceV2, CollectionServiceV4, ODataCollectionResponseV2 } from "../../src";
import { Feature } from "../fixture/PersonModel";
import { commonCollectionTests, getParams } from "../CollectionServiceTests";

describe("CollectionService V2 Tests", () => {
  const odataClient = new MockODataClient();

  const stringConstructor = (url: string): CollectionServiceV2<StringCollection, QStringV2Collection> => {
    return new CollectionServiceV2(odataClient, url, new QStringV2Collection());
  };
  const enumConstructor = (url: string): CollectionServiceV2<EnumCollection<Feature>, QEnumCollection> => {
    return new CollectionServiceV2(odataClient, url, new QEnumCollection());
  };

  commonCollectionTests(odataClient, stringConstructor, enumConstructor);

  test("collection: query", async () => {
    const stringService = stringConstructor("testString");
    const enumService = enumConstructor("testEnum");

    const result: HttpResponseModel<ODataCollectionResponseV2<StringCollection>> = await stringService.query();
    const resultEnum: HttpResponseModel<ODataCollectionResponseV2<StringCollection>> = await enumService.query();
  });

  test("collection: count", async () => {
    const stringService = stringConstructor("testString");
    const params = getParams({ $inlinecount: "allpages" });
    const expected = "testString" + params;

    await stringService.query((builder) => builder.count());

    expect(odataClient.lastUrl).toBe(expected);
  });
});
