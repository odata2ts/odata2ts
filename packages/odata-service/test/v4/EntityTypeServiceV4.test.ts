import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { beforeEach, describe, expect, test } from "vitest";
import { DEFAULT_HEADERS } from "../../src";
import { commonEntityTypeServiceTests } from "../EntityTypeServiceTests";
import { PersonModel } from "../fixture/PersonModel";
import { PersonModelService } from "../fixture/v4/PersonModelService";
import { QPersonV4, qPersonV4 } from "../fixture/v4/QPersonV4";
import { MockClient } from "../mock/MockClient";

describe("EntityTypeService V4 Tests", () => {
  const odataClient = new MockClient(false);
  const BASE_URL = "test";
  const NAME = "test('tester')";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;
  const REQUEST_CONFIG = { test: "Test" };

  let testService: PersonModelService<MockClient>;

  commonEntityTypeServiceTests(odataClient, PersonModelService);

  beforeEach(() => {
    testService = new PersonModelService(odataClient, BASE_URL, NAME);
  });

  test("entityType V4: patch", async () => {
    const model: Partial<PersonModel> = { Age: "45" };
    const requestModel = { Age: 45, "@odata.type": `#Trippin.Person` };

    await testService.patch({ ...model, "@odata.type": `#Trippin.Person` });

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastOperation).toBe("PATCH");
    expect(odataClient.lastData).toEqual(requestModel);
    expect(odataClient.lastRequestConfig).toBeUndefined();
    expect(odataClient.additionalHeaders).toStrictEqual(DEFAULT_HEADERS);

    await testService.patch(model, REQUEST_CONFIG);
    expect(odataClient.lastRequestConfig).toStrictEqual(REQUEST_CONFIG);
  });

  test("entityType V4: big number", async () => {
    testService = new PersonModelService(odataClient, BASE_URL, NAME, { bigNumbersAsString: true });

    await testService.query();

    expect(odataClient.additionalHeaders).toStrictEqual({
      Accept: "application/json;IEEE754Compatible=true",
      "Content-Type": "application/json;IEEE754Compatible=true",
    });
  });

  test("entityType V4: typing of query stuff", async () => {
    // typing test of result
    const result: HttpResponseModel<ODataModelResponseV4<PersonModel>> = await testService.query((builder) => {
      // typing test of builder
      const resultB: ODataQueryBuilderV4<QPersonV4> = builder;
    });

    // manual typings provided
    const result2: HttpResponseModel<ODataModelResponseV4<{ userName: string }>> = await testService.query<
      Pick<PersonModel, "userName">
    >((builder) => {
      // typing test of builder
      const resultB: ODataQueryBuilderV4<QPersonV4> = builder;
    });
  });
});
