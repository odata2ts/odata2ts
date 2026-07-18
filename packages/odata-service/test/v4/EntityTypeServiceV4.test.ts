import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataModelPayloadV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { DEFAULT_HEADERS, RequestInfo } from "../../src";
import { commonEntityTypeServiceTests } from "../EntityTypeServiceTests";
import { EditablePersonModel, Feature, PersonModel } from "../fixture/PersonModel";
import { EditableFlightModel, PlanItemService } from "../fixture/v4/BaseTypeModel";
import { PersonModelService } from "../fixture/v4/PersonModelService";
import { MockClient } from "../mock/MockClient";

describe("EntityTypeService V4 Tests", () => {
  const odataClient = new MockClient(false);
  const BASE_URL = "test";
  const NAME = "test('tester')";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;

  let testService: PersonModelService<MockClient>;

  commonEntityTypeServiceTests(odataClient, PersonModelService);

  beforeEach(() => {
    testService = new PersonModelService(odataClient, BASE_URL, NAME);
  });

  test("entityType V4: patch", async () => {
    const model: Partial<PersonModel> = { age: "45" };
    const requestModel = { Age: 45 };

    const request = testService.patch(model);
    const result = request.getInfo();

    expectTypeOf(result).toEqualTypeOf<RequestInfo<ODataModelPayloadV4<Partial<EditablePersonModel>>>>();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.method).toBe("PATCH");
    expect(result.headers).toStrictEqual(DEFAULT_HEADERS);
    expect(result.data).toEqual(model);
    expect(request.getInfoConverted().data).toEqual(requestModel);

    expectTypeOf(await testService.patch(model).execute()).toEqualTypeOf<HttpResponseModel<undefined>>();
    expectTypeOf(await testService.patch<false>(model).execute()).toEqualTypeOf<HttpResponseModel<undefined>>();

    // check response conversion
    odataClient.setModelResponse(requestModel);
    const response = await testService.patch<true>(model).execute();

    expect(response.data).toStrictEqual(model);
    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<PersonModel>>>();

    // subtype options won't take any effect
    const request2 = testService
      .patch(model, { withCastPathSegment: true, withTypeControlInfo: true })
      .getInfoConverted();
    expect(request2).toMatchObject(request.getInfoConverted());
  });

  test("entityType V4: update", async () => {
    const model: EditablePersonModel = {
      userName: "tester",
      age: "14",
      favFeature: Feature.Feature1,
      features: [Feature.Feature1],
    };
    const requestModel = {
      UserName: "tester",
      Age: 14,
      FavFeature: "Feature1",
      Features: ["Feature1"],
    };

    const request = testService.update(model);
    let result = request.getInfo();

    expectTypeOf(result).toEqualTypeOf<RequestInfo<ODataModelPayloadV4<EditablePersonModel>>>();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.method).toBe("PUT");
    expect(result.headers).toStrictEqual(DEFAULT_HEADERS);
    expect(result.data).toEqual(model);
    expect(request.getInfoConverted().data).toEqual(requestModel);

    expectTypeOf(await testService.update(model).execute()).toEqualTypeOf<HttpResponseModel<undefined>>();
    expectTypeOf(await testService.update<false>(model).execute()).toEqualTypeOf<HttpResponseModel<undefined>>();

    // check response conversion
    odataClient.setModelResponse(requestModel);
    const response = await testService.update<true>(model).execute();

    expect(response.data).toStrictEqual(model);
    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<PersonModel>>>();
  });

  test("entityType V4: patch & update subtype", async () => {
    const serviceToTest = new PlanItemService(odataClient, BASE_URL, NAME).asFlightService();
    const inputModel: EditableFlightModel = {
      id: 123,
      name: "Optional",
      flightNumber: "F123",
    };
    const typeModel = {
      "@odata.type": "#Tester.Flight",
    };
    const expectedModel = { ...inputModel, ...typeModel };
    const odataModel = {
      ...typeModel,
      Id: inputModel.id,
      Name: inputModel.name,
      FlightNumber: inputModel.flightNumber,
    };

    // patch
    const patchCmd = serviceToTest.patch(inputModel);
    let result = patchCmd.getInfo();

    expectTypeOf(result).toEqualTypeOf<RequestInfo<ODataModelPayloadV4<Partial<EditableFlightModel>>>>();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.method).toBe("PATCH");
    expect(result.data).toEqual(expectedModel);
    expect(patchCmd.getInfoConverted().data).toEqual(odataModel);

    // update
    const updateCmd = serviceToTest.update(inputModel);
    const resultUpdate = updateCmd.getInfo();
    expect(resultUpdate.url).toBe(EXPECTED_PATH);
    expect(resultUpdate.method).toBe("PUT");
    expect(resultUpdate.data).toEqual(expectedModel);
    expect(updateCmd.getInfoConverted().data).toStrictEqual(odataModel);

    expectTypeOf(resultUpdate).toEqualTypeOf<RequestInfo<ODataModelPayloadV4<EditableFlightModel>>>();
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

    let request = serviceToTest.patch(inputModel, { withTypeControlInfo: false }).getInfoConverted();
    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.data).toEqual(odataModel);

    request = serviceToTest.update(inputModel, { withTypeControlInfo: false }).getInfoConverted();
    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.data).toEqual(odataModel);

    request = serviceToTest.patch(inputModel, { withCastPathSegment: true }).getInfoConverted();
    expect(request.url).toBe(EXPECTED_PATH + "/Tester.Flight");
    expect(request.data).toEqual(odataModel);

    request = serviceToTest.update(inputModel, { withCastPathSegment: true }).getInfoConverted();
    expect(request.url).toBe(EXPECTED_PATH + "/Tester.Flight");
    expect(request.data).toEqual(odataModel);

    request = serviceToTest
      .patch(inputModel, { withCastPathSegment: true, withTypeControlInfo: true })
      .getInfoConverted();
    expect(request.url).toBe(EXPECTED_PATH + "/Tester.Flight");
    expect(request.data).toEqual(odataModelWithType);

    request = serviceToTest
      .update(inputModel, { withCastPathSegment: true, withTypeControlInfo: true })
      .getInfoConverted();
    expect(request.url).toBe(EXPECTED_PATH + "/Tester.Flight");
    expect(request.data).toEqual(odataModelWithType);
  });

  test("entityType V4: big number", async () => {
    testService = new PersonModelService(odataClient, BASE_URL, NAME, { bigNumbersAsString: true });

    const request = testService.query().getInfo();

    expect(request.headers).toStrictEqual({
      Accept: "application/json;IEEE754Compatible=true",
      "Content-Type": "application/json;IEEE754Compatible=true",
    });
  });
});
