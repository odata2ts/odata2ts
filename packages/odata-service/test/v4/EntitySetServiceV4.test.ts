import { ODataUriBuilderV4 } from "@odata2ts/odata-uri-builder";
import { HttpResponseModel } from "@odata2ts/odata-client-api";

import { ODataCollectionResponseV4 } from "../../src/";
import { MockODataClient } from "../mock/MockODataClient";
import { PersonModel } from "../fixture/PersonModel";
import {
  QPersonV4,
  PersonModelCollectionService,
  PersonModelService,
  qPersonV4,
} from "../fixture/v4/PersonModelService";
import { commonEntitySetTests } from "../EntitySetServiceTests";

describe("V4 EntitySetService Test", () => {
  const odataClient = new MockODataClient();
  const BASE_URL = "/test";

  let testService: PersonModelCollectionService;

  commonEntitySetTests(odataClient, PersonModelCollectionService);

  beforeEach(() => {
    testService = new PersonModelCollectionService(odataClient, BASE_URL);
  });

  test("entitySet V2: QObject", async () => {
    expect(testService.getQObject()).toBe(qPersonV4);
  });

  test("entitySet: ensure query typings", async () => {
    // just a typing test: this only needs to compile
    const result: HttpResponseModel<ODataCollectionResponseV4<PersonModel>> = await testService.query((builder) => {
      const bResult: ODataUriBuilderV4<QPersonV4> = builder;
    });
  });

  test("entitySet: ensure typing of EntityTypeService", async () => {
    // just a typing test: this only needs to compile
    const result: PersonModelService = testService.get({ UserName: "heinz" });
  });
});
