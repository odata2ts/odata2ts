import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataModelResponseV2 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV2 } from "@odata2ts/odata-query-builder";

import { DEFAULT_HEADERS, MERGE_HEADERS } from "../../src/RequestHeaders";
import { commonEntityTypeServiceTests } from "../EntityTypeServiceTests";
import { PersonModel } from "../fixture/PersonModel";
import { PersonModelV2Service } from "../fixture/v2/PersonModelV2Service";
import { QPersonV2 } from "../fixture/v2/QPersonV2";
import { MockClient } from "../mock/MockClient";

describe("EntityTypeService V2 Test", () => {
  const odataClient = new MockClient(true);
  const BASE_URL = "path";
  const NAME = "test('tester')";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;

  const REQUEST_CONFIG = { test: "Test" };

  let testService: PersonModelV2Service<MockClient>;

  commonEntityTypeServiceTests(odataClient, PersonModelV2Service);

  beforeEach(() => {
    testService = new PersonModelV2Service(odataClient, BASE_URL, NAME);
  });

  test("entityType: patch = merge", async () => {
    const model: Partial<PersonModel> = { Age: "45" };
    const odataModel = { Age: 45 };

    odataClient.setModelResponse(odataModel);
    let result = await testService.patch(model);
    // @ts-ignore
    const resultData = result.data.d;

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastData).toEqual({ Age: 45 });
    expect(odataClient.lastRequestConfig).toBeUndefined();
    expect(odataClient.additionalHeaders).toStrictEqual({ ...DEFAULT_HEADERS, ...MERGE_HEADERS });
    expect(resultData).toStrictEqual(odataModel);

    result = await testService.patch(model, REQUEST_CONFIG);
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
    expect(result.data).toBeNull();
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
