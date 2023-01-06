import { HttpResponseModel } from "@odata2ts/odata-client-api";
import { ODataCollectionResponseV2 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV2 } from "@odata2ts/odata-query-builder";

import { commonEntitySetTests } from "../EntitySetServiceTests";
import { PersonModel } from "../fixture/PersonModel";
import { PersonModelV2CollectionService, PersonModelV2Service } from "../fixture/v2/PersonModelV2Service";
import { QPersonV2, qPersonV2 } from "../fixture/v2/QPersonV2";
import { MockODataClient } from "../mock/MockODataClient";

describe("V2 EntitySetService Test", () => {
  const odataClient = new MockODataClient(true);
  const BASE_URL = "";
  const NAME = "test";

  let testService: PersonModelV2CollectionService<MockODataClient>;

  commonEntitySetTests(odataClient, PersonModelV2CollectionService);

  beforeEach(() => {
    testService = new PersonModelV2CollectionService(odataClient, BASE_URL, NAME);
  });

  test("entitySet V2: QObject", async () => {
    await testService.patch("abab", { userName: "holla" }, { test: "tester" });

    expect(testService.getQObject()).toBe(qPersonV2);
  });

  test("entitySet V2: ensure query typings", async () => {
    // just a typing test: this only needs to compile
    const result: HttpResponseModel<ODataCollectionResponseV2<PersonModel>> = await testService.query((builder) => {
      const bResult: ODataQueryBuilderV2<QPersonV2> = builder;
    });
  });

  test("entitySet V2: ensure typing of EntityTypeService", async () => {
    // just a typing test: this only needs to compile
    const result: PersonModelV2Service<MockODataClient> = testService.get({ userName: "heinz" });
  });
});
