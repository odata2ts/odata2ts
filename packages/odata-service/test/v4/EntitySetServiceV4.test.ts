import { FlexibleODataModelPayloadV4, ODataModelPayloadV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { DEFAULT_HEADERS, getODataVersionHeaders, ODataResponseModel, RequestInfo } from "../../src";
import { commonEntitySetTests } from "../EntitySetServiceTests";
import { EditablePersonModel, Feature, PersonModel } from "../fixture/PersonModel";
import {
  EditableFlightModel,
  FlightModel,
  FlightService,
  PlanItemCollectionService,
  PlanItemModel,
} from "../fixture/v4/BaseTypeModel";
import { PersonModelCollectionService, PersonModelService } from "../fixture/v4/PersonModelService";
import { TestCollectionService, TestCollectionServiceWithAlternateKey } from "../fixture/v4/TypingModelService";
import { MockClient } from "../mock/MockClient";

describe("V4 EntitySetService Test", () => {
  const odataClient = new MockClient(false);
  const BASE_URL = "/base";
  const NAME = "test";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;

  let testService: PersonModelCollectionService;

  commonEntitySetTests(odataClient, PersonModelCollectionService);

  beforeEach(() => {
    testService = new PersonModelCollectionService(odataClient, BASE_URL, NAME);
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

    const request = testService.create(model);
    let result = request.getInfo();

    expectTypeOf(result).toEqualTypeOf<RequestInfo<ODataModelPayloadV4<EditablePersonModel>>>();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.method).toBe("POST");
    expect(result.headers).toStrictEqual({ ...DEFAULT_HEADERS, ...getODataVersionHeaders() });
    expect(result.data).toStrictEqual(model);
    expect(request.getInfoConverted().data).toStrictEqual(odataModel);

    // check type conversion
    odataClient.setModelResponse(odataModel);
    const response = await testService.create(model).execute();
    expect(response.data).toStrictEqual(model);

    expectTypeOf(response).toEqualTypeOf<ODataResponseModel<ODataModelResponseV4<PersonModel>>>();
    expectTypeOf(await testService.create<false>(model).execute()).toEqualTypeOf<ODataResponseModel<undefined>>();

    // subtype options won't take effect
    result = testService.create(model, { withTypeControlInfo: true, withCastPathSegment: true }).getInfoConverted();
    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.data).toStrictEqual(odataModel);
  });

  test("entitySet: create with select/expand", async () => {
    const unencodedService = new PersonModelCollectionService(odataClient, BASE_URL, NAME, { noUrlEncoding: true });
    const model: EditablePersonModel = {
      userName: "tester",
      age: "14",
      favFeature: Feature.Feature1,
      features: [Feature.Feature1],
    };

    const request = unencodedService.create(model, undefined, (b) => b.select("userName"));

    expect(request.getInfo().url).toBe(EXPECTED_PATH + "?$select=UserName");
    expect(request.getInfo().method).toBe("POST");
  });

  test("entitySet: create returns a builder-backed Cmd, addToQuery works", async () => {
    const unencodedService = new PersonModelCollectionService(odataClient, BASE_URL, NAME, { noUrlEncoding: true });
    const model: EditablePersonModel = {
      userName: "tester",
      age: "14",
      favFeature: Feature.Feature1,
      features: [Feature.Feature1],
    };

    const request = unencodedService.create(model).addToQuery((b) => b.select("userName"));

    expect(request.getInfo().url).toBe(EXPECTED_PATH + "?$select=UserName");
    expect(request.getInfo().method).toBe("POST");
    expect(request.getInfo().data).toEqual(model);
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

    expectTypeOf(await cmd.execute()).toEqualTypeOf<ODataResponseModel<ODataModelResponseV4<FlightModel>>>();
  });

  /**
   * The scenario `byId` exists for: a key that only a subtype's own property identifies (e.g. an
   * alternate key declared on that subtype alone) needs the cast segment in the URL - unlike `create`,
   * which can address the base collection directly, a key predicate belonging to the subtype cannot be
   * built without it.
   */
  test("entitySet: byId after a subtype cast keys through the cast segment", () => {
    const serviceToTest = new PlanItemCollectionService(odataClient, BASE_URL, NAME).asFlightCollectionService();

    const entityService = serviceToTest.byId(123);

    expectTypeOf(entityService).toEqualTypeOf<FlightService>();
    expect(entityService.getPath()).toBe(`${EXPECTED_PATH}/Tester.Flight(123)`);
  });

  test("entitySet: create subtype from base type", async () => {
    const serviceToTest = new PlanItemCollectionService(odataClient, BASE_URL, NAME);
    // control information belongs to the payload, not to the model
    const inputModel: ODataModelPayloadV4<EditableFlightModel> = {
      "@odata.type": "#Tester.Flight",
      id: 123,
      name: "Optional",
      flightNumber: "F123",
    };
    const odataModel = {
      "@odata.type": inputModel["@odata.type"],
      Id: inputModel.id,
      Name: inputModel.name,
      FlightNumber: inputModel.flightNumber,
    };

    const request = serviceToTest.create(inputModel);
    const result = request.getInfo();

    expect(result.data).toStrictEqual(inputModel);
    expect(request.getInfoConverted().data).toStrictEqual(odataModel);

    expectTypeOf(await request.execute()).toEqualTypeOf<ODataResponseModel<ODataModelResponseV4<PlanItemModel>>>();
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

    // as subtype control info gets added automatically
    let request = serviceToTest.create(inputModel);
    let result = request.getInfoConverted();
    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.data).toStrictEqual(odataModelTyped);

    expectTypeOf(await request.execute()).toEqualTypeOf<ODataResponseModel<ODataModelResponseV4<FlightModel>>>();

    // don't add control info about type
    result = serviceToTest.create(inputModel, { withTypeControlInfo: false }).getInfoConverted();
    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.data).toStrictEqual(odataModel);

    // use path segment for type info instead
    result = serviceToTest.create(inputModel, { withCastPathSegment: true }).getInfoConverted();
    expect(result.url).toBe(EXPECTED_PATH + "/Tester.Flight");
    expect(result.data).toStrictEqual(odataModel);

    // use all options
    result = serviceToTest
      .create(inputModel, { withCastPathSegment: true, withTypeControlInfo: true })
      .getInfoConverted();
    expect(result.url).toBe(EXPECTED_PATH + "/Tester.Flight");
    expect(result.data).toStrictEqual(odataModelTyped);
  });

  test("entitySet: big number", async () => {
    testService = new PersonModelCollectionService(odataClient, BASE_URL, NAME, { bigNumbersAsString: true });

    const request = testService.query().getInfo();

    expect(request.headers).toStrictEqual({
      Accept: "application/json;IEEE754Compatible=true",
      "Content-Type": "application/json;IEEE754Compatible=true",
    });
  });

  test("entitySet: collection-bound function sits on the collection path (no key predicate)", async () => {
    const unencodedService = new PersonModelCollectionService(odataClient, BASE_URL, NAME, { noUrlEncoding: true });

    const request = unencodedService
      .getSomething({
        testGuid: { prefix: "xxx", value: "123" },
        testDateTime: "1",
        testDateTimeO: "2",
        testTime: "3",
      })
      .getInfo();

    // operation is bound to the collection => appended directly to the set path, without any key predicate
    expect(request.url).toBe(`${EXPECTED_PATH}/GET_SOMETHING(TEST_GUID=123,testDateTime=1,testDateTimeO=2,testTime=3)`);
    expect(request.method).toBe("GET");
    expect(request.data).toBeUndefined();
  });

  test("entitySet: createKey & parseKey with conversions", async () => {
    const toTest = new TestCollectionService(odataClient, "", NAME);
    expect(toTest.createKey("123")).toBe(`${NAME}(123)`);
    expect(toTest.createKey({ id: "456" })).toBe(`${NAME}(ID=456)`);

    expect(toTest.parseKey(`${NAME}(123)`)).toBe("123");
    expect(toTest.parseKey(`${NAME}(ID=456)`)).toStrictEqual({ id: "456" });
  });

  test("byId builds the entity-type service addressed by the given key", () => {
    const entityService = testService.byId("tester");

    expectTypeOf(entityService).toEqualTypeOf<PersonModelService>();
    expect(entityService.getPath()).toBe(`${EXPECTED_PATH}('tester')`);
  });

  describe("alternate keys", () => {
    let toTest: TestCollectionServiceWithAlternateKey;

    beforeEach(() => {
      toTest = new TestCollectionServiceWithAlternateKey(odataClient, "", NAME);
    });

    test("getKeySpec returns the primary key's param spec only", () => {
      const spec = toTest.getKeySpec();
      expect(spec).toHaveLength(1);
      expect(spec[0].getName()).toBe("ID");
    });

    test("getAlternateKeySpecs returns every alternate key's param spec", () => {
      const specs = toTest.getAlternateKeySpecs();
      expect(specs).toHaveLength(1);
      expect(specs[0]).toHaveLength(1);
      expect(specs[0][0].getName()).toBe("NAME");
    });

    test("createKey builds the primary or the alternate key's URL depending on the shape given", () => {
      expect(toTest.createKey("7")).toBe(`${NAME}(7)`);
      expect(toTest.createKey({ id: "7" })).toBe(`${NAME}(ID=7)`);
      expect(toTest.createKey({ name: "russell" })).toBe(`${NAME}(NAME='russell')`);
    });

    test("parseKey resolves either shape from the URL", () => {
      expect(toTest.parseKey(`${NAME}(ID=7)`)).toStrictEqual({ id: "7" });
      expect(toTest.parseKey(`${NAME}(NAME='russell')`)).toStrictEqual({ name: "russell" });
    });

    test("byId builds the entity-type service for the alternate key just as well as for the primary one", () => {
      expect(toTest.byId("7").getPath()).toBe(`${NAME}(7)`);
      expect(toTest.byId({ name: "russell" }).getPath()).toBe(`${NAME}(NAME='russell')`);
    });
  });
});
