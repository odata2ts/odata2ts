import { HttpResponseModel } from "@odata2ts/odata-client-api";
import { ODataModelResponseV2 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV2 } from "@odata2ts/odata-query-builder";

import { commonEntityTypeServiceTests } from "../EntityTypeServiceTests";
import { PersonModel } from "../fixture/PersonModel";
import { PersonModelV2Service } from "../fixture/v2/PersonModelV2Service";
import { QPersonV2 } from "../fixture/v2/QPersonV2";
import { MockODataClient } from "../mock/MockODataClient";

describe("EntityTypeService V2 Test", () => {
  const odataClient = new MockODataClient(true);
  const BASE_URL = "path";
  const NAME = "test('tester')";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;

  const REQUEST_CONFIG = { test: "Test" };

  let testService: PersonModelV2Service<MockODataClient>;

  commonEntityTypeServiceTests(odataClient, PersonModelV2Service);

  beforeEach(() => {
    testService = new PersonModelV2Service(odataClient, BASE_URL, NAME);
  });

  // TODO
  test.skip("entityType V2: query object", async () => {
    expect(testService.getQObject()).toMatchObject(new QPersonV2());
  });

  test("entityType V2: typing of query stuff", async () => {
    // typing test of result
    const result: HttpResponseModel<ODataModelResponseV2<PersonModel>> = await testService.query((builder) => {
      // typing test of builder
      const resultB: ODataQueryBuilderV2<QPersonV2> = builder;
    });

    // manual typings provided
    const result2: HttpResponseModel<ODataModelResponseV2<{ userName: string }>> = await testService.query<
      Pick<PersonModel, "userName">
    >((builder) => {
      // typing test of builder
      const resultB: ODataQueryBuilderV2<QPersonV2> = builder;
    });
  });

  test("entityType V2: function params", async () => {
    await testService.getSomething({
      testGuid: { prefix: "xxx", value: "123" },
      testDateTime: "1",
      testDateTimeO: "2",
      testTime: "3",
    });
    expect(odataClient.lastUrl).toBe(
      EXPECTED_PATH +
        "/GET_SOMETHING?TEST_GUID=guid'123'&testDateTime=datetime'1'&testDateTimeO=datetimeoffset'2'&testTime=time'3'"
    );
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastRequestConfig).toBeUndefined();

    await testService.getSomething(
      { testGuid: { prefix: "xxx", value: "123" }, testDateTime: "1", testDateTimeO: "2", testTime: "3" },
      REQUEST_CONFIG
    );
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
  });
});
