import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import { beforeEach, describe, expect, test } from "vitest";
import { DEFAULT_HEADERS } from "../../src/RequestHeaders";
import { commonEntitySetTests } from "../EntitySetServiceTests";
import { EditablePersonModel, Feature, PersonModel } from "../fixture/PersonModel";
import {
  EditableFlightModel,
  EditablePlanItemModel,
  FlightModel,
  PlanItemCollectionService,
} from "../fixture/v4/BaseTypeModel";
import { PersonModelCollectionService } from "../fixture/v4/PersonModelService";
import { QPersonV4 } from "../fixture/v4/QPersonV4";
import { TestCollectionService } from "../fixture/v4/TypingModelService";
import { MockClient } from "../mock/MockClient";

describe("V4 EntitySetService Test", () => {
  const odataClient = new MockClient(false);
  const BASE_URL = "/base";
  const NAME = "test";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;
  const REQUEST_CONFIG = { test: "Test" };

  let testService: PersonModelCollectionService<MockClient>;

  commonEntitySetTests(odataClient, PersonModelCollectionService);

  beforeEach(() => {
    testService = new PersonModelCollectionService(odataClient, BASE_URL, NAME);
  });

  test("entitySet: big number", async () => {
    testService = new PersonModelCollectionService(odataClient, BASE_URL, NAME, { bigNumbersAsString: true });

    await testService.query();

    expect(odataClient.additionalHeaders).toStrictEqual({
      Accept: "application/json;IEEE754Compatible=true",
      "Content-Type": "application/json;IEEE754Compatible=true",
    });
  });

  test("entitySet: create", async () => {
    const model: EditablePersonModel = {
      userName: "tester",
      Age: "14",
      FavFeature: Feature.Feature1,
      Features: [Feature.Feature1],
    };
    const odataModel = {
      UserName: "tester",
      Age: 14,
      FavFeature: "Feature1",
      Features: ["Feature1"],
    };

    odataClient.setModelResponse(odataModel);
    let result = await testService.create(model);
    // @ts-ignore
    const resultData = result.data.d || result.data;

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastData).toStrictEqual(odataModel);
    expect(odataClient.lastRequestConfig).toBeUndefined();
    expect(odataClient.additionalHeaders).toStrictEqual(DEFAULT_HEADERS);
    expect(resultData).toStrictEqual(model);

    result = await testService.create(model, REQUEST_CONFIG);
    expect(odataClient.lastRequestConfig).toMatchObject(REQUEST_CONFIG);
    expect(result.data).toBeNull();

    // subtype options won't take effect
    await testService.create(model, undefined, { withTypeControlInfo: true, withCastPathSegment: true });
    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastData).toStrictEqual(odataModel);
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

    odataClient.setModelResponse(odataModel);
    const result = await serviceToTest.create(inputModel);

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastData).toStrictEqual(odataModel);
    expect(result.data).toStrictEqual(expectedModel);
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

    odataClient.setModelResponse(odataModel);
    const result = await serviceToTest.create(inputModel);

    expect(odataClient.lastData).toStrictEqual(odataModel);
    expect(result.data).toStrictEqual(inputModel);
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
    await serviceToTest.create(inputModel, undefined, { withTypeControlInfo: false });
    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastData).toStrictEqual(odataModel);

    // use path segment for type info
    await serviceToTest.create(inputModel, undefined, { withCastPathSegment: true });
    expect(odataClient.lastUrl).toBe(EXPECTED_PATH + "/Tester.Flight");
    expect(odataClient.lastData).toStrictEqual(odataModel);

    // use all options
    await serviceToTest.create(inputModel, undefined, { withCastPathSegment: true, withTypeControlInfo: true });
    expect(odataClient.lastUrl).toBe(EXPECTED_PATH + "/Tester.Flight");
    expect(odataClient.lastData).toStrictEqual(odataModelTyped);
  });

  test("entitySet: ensure query typings", async () => {
    // just a typing test: this only needs to compile
    const result: HttpResponseModel<ODataCollectionResponseV4<PersonModel>> = await testService.query((builder) => {
      const bResult: ODataQueryBuilderV4<QPersonV4> = builder;
    });

    // manual typings provided
    const result2: HttpResponseModel<ODataCollectionResponseV4<{ userName: string }>> = await testService.query<
      Pick<PersonModel, "userName">
    >((builder) => {
      const bResult: ODataQueryBuilderV4<QPersonV4> = builder;
    });
  });

  test("entitySet: createKey & parseKey with conversions", async () => {
    const toTest = new TestCollectionService(odataClient, "", NAME);
    expect(toTest.createKey("123")).toBe(`${NAME}(123)`);
    expect(toTest.createKey({ id: "456" })).toBe(`${NAME}(ID=456)`);

    expect(toTest.parseKey(`${NAME}(123)`)).toBe("123");
    expect(toTest.parseKey(`${NAME}(ID=456)`)).toStrictEqual({ id: "456" });
  });
});
