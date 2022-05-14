import { HttpResponseModel } from "@odata2ts/odata-client-api";
import { ODataUriBuilderV4 } from "@odata2ts/odata-uri-builder";

import { ODataModelResponseV4 } from "../../src";
import { MockODataClient } from "../mock/MockODataClient";
import { PersonModelService, QPersonV4, qPersonV4 } from "../fixture/v4/PersonModelService";
import { PersonModel } from "../fixture/PersonModel";
import { commonEntityTypeServiceTests } from "../EntityTypeServiceTests";

describe("EntityTypeService V4 Tests", () => {
  const odataClient = new MockODataClient();
  const BASE_URL = "/test('tester')";

  let testService: PersonModelService;

  commonEntityTypeServiceTests(odataClient, PersonModelService);

  beforeEach(() => {
    testService = new PersonModelService(odataClient, BASE_URL);
  });

  // TODO
  test.skip("entityType V4: query object", async () => {
    expect(testService.getQObject()).toMatchObject(qPersonV4);
  });

  test("entityType V4: typing of query stuff", async () => {
    // typing test of result
    const result: HttpResponseModel<ODataModelResponseV4<PersonModel>> = await testService.query((builder) => {
      // typing test of builder
      const resultB: ODataUriBuilderV4<QPersonV4> = builder;
    });
  });
});
