import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { beforeEach, describe, expect, test } from "vitest";
import { DEFAULT_HEADERS } from "../../src";
import { commonEntityTypeServiceTests } from "../EntityTypeServiceTests";
import { PersonModel } from "../fixture/PersonModel";
import { EditableFlightModel, PlanItemService } from "../fixture/v4/BaseTypeModel";
import { PersonModelService } from "../fixture/v4/PersonModelService";
import { QPersonV4 } from "../fixture/v4/QPersonV4";
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
    const requestModel = { Age: 45 };

    await testService.patch(model);

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastOperation).toBe("PATCH");
    expect(odataClient.lastData).toEqual(requestModel);
    expect(odataClient.lastRequestConfig).toBeUndefined();
    expect(odataClient.additionalHeaders).toStrictEqual(DEFAULT_HEADERS);

    await testService.patch(model, REQUEST_CONFIG);
    expect(odataClient.lastRequestConfig).toStrictEqual(REQUEST_CONFIG);

    // subtype options won't take effect
    await testService.patch(model, REQUEST_CONFIG, { withCastPathSegment: true, withTypeControlInfo: true });
    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastData).toEqual(requestModel);
  });

  test("entityType V4: patch & update subtype", async () => {
    const serviceToTest = new PlanItemService(odataClient, BASE_URL, NAME).asFlightService();
    const inputModel: EditableFlightModel = {
      id: 123,
      name: "Optional",
      flightNumber: "F123",
    };
    const expectedModel = { ...inputModel, "@odata.type": "#Tester.Flight" };
    const odataModel = {
      "@odata.type": "#Tester.Flight",
      Id: inputModel.id,
      Name: inputModel.name,
      FlightNumber: inputModel.flightNumber,
    };

    // patch
    odataClient.setModelResponse(odataModel);
    let result = await serviceToTest.patch(inputModel);
    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastOperation).toBe("PATCH");
    expect(odataClient.lastData).toEqual(odataModel);
    expect(result.data).toStrictEqual(expectedModel);

    // update
    odataClient.setModelResponse(odataModel);
    result = await serviceToTest.update(inputModel);
    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastData).toEqual(odataModel);
    expect(result.data).toStrictEqual(expectedModel);
  });

  test("entityType V4: patch & update subtype with options", async () => {
    const serviceToTest = new PlanItemService(odataClient, BASE_URL, NAME).asFlightService();
    const inputModel: EditableFlightModel = {
      id: 123,
      name: "Optional",
      flightNumber: "F123",
    };
    const odataModel = {
      Id: inputModel.id,
      Name: inputModel.name,
      FlightNumber: inputModel.flightNumber,
    };
    const odataModelWithType = { ...odataModel, "@odata.type": "#Tester.Flight" };

    await serviceToTest.patch(inputModel, undefined, { withTypeControlInfo: false });
    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastData).toEqual(odataModel);

    await serviceToTest.update(inputModel, undefined, { withTypeControlInfo: false });
    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastData).toEqual(odataModel);

    await serviceToTest.patch(inputModel, undefined, { withCastPathSegment: true });
    expect(odataClient.lastUrl).toBe(EXPECTED_PATH + "/Tester.Flight");
    expect(odataClient.lastData).toEqual(odataModel);

    await serviceToTest.update(inputModel, undefined, { withCastPathSegment: true });
    expect(odataClient.lastUrl).toBe(EXPECTED_PATH + "/Tester.Flight");
    expect(odataClient.lastData).toEqual(odataModel);

    await serviceToTest.patch(inputModel, undefined, { withCastPathSegment: true, withTypeControlInfo: true });
    expect(odataClient.lastUrl).toBe(EXPECTED_PATH + "/Tester.Flight");
    expect(odataClient.lastData).toEqual(odataModelWithType);

    await serviceToTest.update(inputModel, undefined, { withCastPathSegment: true, withTypeControlInfo: true });
    expect(odataClient.lastUrl).toBe(EXPECTED_PATH + "/Tester.Flight");
    expect(odataClient.lastData).toEqual(odataModelWithType);
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
