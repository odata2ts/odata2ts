import { HttpResponseModel } from "@odata2ts/odata-client-api";
import { QStringCollection, StringCollection, QEnumCollection, EnumCollection } from "@odata2ts/odata-query-objects";

import { CollectionServiceV4, ODataCollectionResponseV4 } from "../../src";
import { MockODataClient } from "../mock/MockODataClient";
import { commonCollectionTests, getParams } from "../CollectionServiceTests";
import { Feature } from "../fixture/PersonModel";

describe("CollectionService V4 Tests", () => {
  const odataClient = new MockODataClient();

  const stringConstructor = (url: string): CollectionServiceV4<StringCollection, QStringCollection> => {
    return new CollectionServiceV4(odataClient, url, new QStringCollection());
  };
  const enumConstructor = (url: string): CollectionServiceV4<EnumCollection<Feature>, QEnumCollection> => {
    return new CollectionServiceV4(odataClient, url, new QEnumCollection());
  };

  commonCollectionTests(odataClient, stringConstructor, enumConstructor);

  test("collection: query typing", async () => {
    const stringService = stringConstructor("testString");
    const enumService = enumConstructor("testEnum");

    const result: HttpResponseModel<ODataCollectionResponseV4<StringCollection>> = await stringService.query();
    const resultEnum: HttpResponseModel<ODataCollectionResponseV4<StringCollection>> = await enumService.query();
  });

  test("collection: count", async () => {
    const stringService = stringConstructor("testString");
    const params = getParams({ $count: "true" });
    const expected = "testString" + params;

    await stringService.query((builder) => builder.count());

    expect(odataClient.lastUrl).toBe(expected);
  });
});
