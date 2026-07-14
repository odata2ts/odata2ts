import { beforeEach, describe, expect, test } from "vitest";
import { DEFAULT_HEADERS } from "../../src";
import { commonEntitySetTests } from "../EntitySetServiceTests";
import { EditablePersonModel, Feature, PersonModel } from "../fixture/PersonModel";
import { EditableFlightModel, PlanItemCollectionService } from "../fixture/v4/BaseTypeModel";
import { PersonModelCollectionService } from "../fixture/v4/PersonModelService";
import { TestCollectionService } from "../fixture/v4/TypingModelService";
import { MockClient } from "../mock/MockClient";

describe("V4 EntitySetService Test", () => {
  const odataClient = new MockClient(false);
  const BASE_URL = "/base";
  const NAME = "test";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;

  let testService: PersonModelCollectionService<MockClient>;

  commonEntitySetTests(odataClient, PersonModelCollectionService);

  beforeEach(() => {
    testService = new PersonModelCollectionService(odataClient, BASE_URL, NAME);
  });

  test("entitySet: big number", async () => {
    testService = new PersonModelCollectionService(odataClient, BASE_URL, NAME, { bigNumbersAsString: true });

    const request = testService.query().getInfo();

    expect(request.headers).toStrictEqual({
      Accept: "application/json;IEEE754Compatible=true",
      "Content-Type": "application/json;IEEE754Compatible=true",
    });
  });

  test("entitySet: create", async () => {
    const model: EditablePersonModel = {
      userName: "tester",
      age: "14",
      favFeature: Feature.Feature1,
      features: [Feature.Feature1],
    };
    const odataModel = {
      UserName: "tester",
      Age: 14,
      FavFeature: "Feature1",
      Features: ["Feature1"],
    };

    const cmd = testService.create(model);
    let request = cmd.getInfo();

    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.method).toBe("POST");
    expect(request.headers).toStrictEqual(DEFAULT_HEADERS);
    expect(request.data).toStrictEqual(model);
    expect(cmd.getInfoConverted().data).toStrictEqual(odataModel);

    // subtype options won't take effect
    request = testService.create(model, { withTypeControlInfo: true, withCastPathSegment: true }).getInfoConverted();
    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.data).toStrictEqual(odataModel);
  });

  test("entitySet: create subtype", async () => {
    const serviceToTest = new PlanItemCollectionService(odataClient, BASE_URL, NAME).asFlightCollectionService();
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

    const cmd = serviceToTest.create(inputModel);
    const request = cmd.getInfo();

    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.method).toBe("POST");
    expect(request.data).toStrictEqual(expectedModel);
    expect(cmd.getInfoConverted().data).toStrictEqual(odataModel);
  });

  test("entitySet: create subtype from base type", async () => {
    const serviceToTest = new PlanItemCollectionService(odataClient, BASE_URL, NAME);
    const inputModel: EditableFlightModel = {
      "@odata.type": "#Tester.Flight",
      id: 123,
      name: "Optional",
      flightNumber: "F123",
    };
    const odataModel = {
      "@odata.type": "#Tester.Flight",
      Id: inputModel.id,
      Name: inputModel.name,
      FlightNumber: inputModel.flightNumber,
    };

    const cmd = serviceToTest.create(inputModel);
    const request = cmd.getInfo();

    expect(request.data).toStrictEqual(inputModel);
    expect(cmd.getInfoConverted().data).toStrictEqual(odataModel);
  });

  test("entitySet: create subtype with options", async () => {
    const serviceToTest = new PlanItemCollectionService(odataClient, BASE_URL, NAME).asFlightCollectionService();
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
    const odataModelTyped = { ...odataModel, "@odata.type": "#Tester.Flight" };

    // don't add control info about type
    let request = serviceToTest.create(inputModel, { withTypeControlInfo: false }).getInfoConverted();
    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.data).toStrictEqual(odataModel);

    // use path segment for type info
    request = serviceToTest.create(inputModel, { withCastPathSegment: true }).getInfoConverted();
    expect(request.url).toBe(EXPECTED_PATH + "/Tester.Flight");
    expect(request.data).toStrictEqual(odataModel);

    // use all options
    request = serviceToTest
      .create(inputModel, { withCastPathSegment: true, withTypeControlInfo: true })
      .getInfoConverted();
    expect(request.url).toBe(EXPECTED_PATH + "/Tester.Flight");
    expect(request.data).toStrictEqual(odataModelTyped);
  });

  test("entitySet: createKey & parseKey with conversions", async () => {
    const toTest = new TestCollectionService(odataClient, "", NAME);
    expect(toTest.createKey("123")).toBe(`${NAME}(123)`);
    expect(toTest.createKey({ id: "456" })).toBe(`${NAME}(ID=456)`);

    expect(toTest.parseKey(`${NAME}(123)`)).toBe("123");
    expect(toTest.parseKey(`${NAME}(ID=456)`)).toStrictEqual({ id: "456" });
  });
});
