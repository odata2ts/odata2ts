import { HttpResponseModel } from "@odata2ts/odata-client-api";
import { ODataUriBuilderV2 } from "@odata2ts/odata-uri-builder";

import { ODataCollectionResponseV2 } from "../../src/";
import { commonEntitySetTests } from "../EntitySetServiceTests";
import { PersonModel } from "../fixture/PersonModel";
import { PersonModelCollectionService, PersonModelService } from "../fixture/v2/PersonModelService";
import { QPersonV2, qPersonV2 } from "../fixture/v2/QPersonV2";
import { MockODataClient } from "../mock/MockODataClient";

describe("V2 EntitySetService Test", () => {
  const odataClient = new MockODataClient(true);
  const BASE_URL = "";
  const NAME = "test";

  let testService: PersonModelCollectionService<MockODataClient>;

  commonEntitySetTests(odataClient, PersonModelCollectionService);

  beforeEach(() => {
    testService = new PersonModelCollectionService(odataClient, BASE_URL, NAME);
  });

  test("entitySet V2: QObject", async () => {
    await testService.patch("abab", { userName: "holla" }, { test: "tester" });

    expect(testService.getQObject()).toBe(qPersonV2);
  });

  test("entitySet V2: ensure query typings", async () => {
    // just a typing test: this only needs to compile
    const result: HttpResponseModel<ODataCollectionResponseV2<PersonModel>> = await testService.query((builder) => {
      const bResult: ODataUriBuilderV2<QPersonV2> = builder;
    });
  });

  test("entitySet V2: ensure typing of EntityTypeService", async () => {
    // just a typing test: this only needs to compile
    const result: PersonModelService<MockODataClient> = testService.get({ userName: "heinz" });
  });
});
