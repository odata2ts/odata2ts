import { HttpResponseModel } from "@odata2ts/odata-client-api";
import { ODataUriBuilderV2 } from "@odata2ts/odata-uri-builder";

import { ODataModelResponseV2 } from "../../src";
import { commonEntityTypeServiceTests } from "../EntityTypeServiceTests";
import { PersonModel } from "../fixture/PersonModel";
import { PersonModelService } from "../fixture/v2/PersonModelService";
import { QPersonV2 } from "../fixture/v2/QPersonV2";
import { MockODataClient } from "../mock/MockODataClient";

describe("EntityTypeService V2 Test", () => {
  const odataClient = new MockODataClient();
  const BASE_URL = "path";
  const NAME = "test('tester')";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;

  const REQUEST_CONFIG = { test: "Test" };

  let testService: PersonModelService<MockODataClient>;

  commonEntityTypeServiceTests(odataClient, PersonModelService);

  beforeEach(() => {
    testService = new PersonModelService(odataClient, BASE_URL, NAME);
  });

  // TODO
  test.skip("entityType V2: query object", async () => {
    expect(testService.getQObject()).toMatchObject(new QPersonV2());
  });

  test("entityType V2: typing of query stuff", async () => {
    // typing test of result
    const result: HttpResponseModel<ODataModelResponseV2<PersonModel>> = await testService.query((builder) => {
      // typing test of builder
      const resultB: ODataUriBuilderV2<QPersonV2> = builder;
    });
  });

  test("entityType V2: function params", async () => {
    await testService.getSomething({ testGuid: "123", testDateTime: "1", testDateTimeO: "2", testTime: "3" });
    expect(odataClient.lastUrl).toBe(
      EXPECTED_PATH +
        "/GET_SOMETHING?testGuid=guid'123'&testDateTime=datetime'1'&testDateTimeO=datetimeoffset'2'&testTime=time'3'"
    );
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastRequestConfig).toBeUndefined();

    await testService.getSomething(
      { testGuid: "123", testDateTime: "1", testDateTimeO: "2", testTime: "3" },
      REQUEST_CONFIG
    );
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
  });
});
