import { HttpResponseModel } from "@odata2ts/odata-client-api";
import { ODataUriBuilderV2 } from "@odata2ts/odata-uri-builder";

import { ODataCollectionResponseV2 } from "../../src/";
import { MockODataClient } from "../mock/MockODataClient";
import { PersonModel } from "../fixture/PersonModel";
import {
  PersonModelCollectionService,
  PersonModelService,
  qPersonV2,
  QPersonV2,
} from "../fixture/v2/PersonModelService";
import { commonEntitySetTests } from "../EntitySetServiceTests";

describe("V2 EntitySetService Test", () => {
  const odataClient = new MockODataClient();
  const BASE_URL = "/test";

  let testService: PersonModelCollectionService;

  commonEntitySetTests(odataClient, PersonModelCollectionService);

  beforeEach(() => {
    testService = new PersonModelCollectionService(odataClient, BASE_URL);
  });

  test("entitySet V2: QObject", async () => {
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
    const result: PersonModelService = testService.get({ UserName: "heinz" });
  });
});
