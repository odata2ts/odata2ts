import { beforeEach, describe, expect, test } from "vitest";
import { DEFAULT_HEADERS } from "../../src";
import { commonEntityTypeServiceTests } from "../EntityTypeServiceTests";
import { PersonModel } from "../fixture/PersonModel";
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

    const cmd = testService.patch(model);
    let request = cmd.getInfo();

    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.method).toBe("PATCH");
    expect(request.headers).toStrictEqual(DEFAULT_HEADERS);
    expect(request.data).toEqual(model);
    expect(cmd.getInfoConverted().data).toEqual(requestModel);

    // subtype options won't take effect
    request = testService.patch(model, { withCastPathSegment: true, withTypeControlInfo: true }).getInfoConverted();
    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.data).toEqual(requestModel);
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
    let request = patchCmd.getInfo();

    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.method).toBe("PATCH");
    expect(request.data).toEqual(expectedModel);
    expect(patchCmd.getInfoConverted().data).toEqual(odataModel);

    // update
    const updateCmd = serviceToTest.update(inputModel);
    request = updateCmd.getInfo();
    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.method).toBe("PUT");
    expect(request.data).toEqual(expectedModel);
    expect(updateCmd.getInfoConverted().data).toStrictEqual(odataModel);
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
