import { HttpResponseModel } from "@odata2ts/http-client-api";
import { FlexibleODataModelPayloadV4, ODataModelPayloadV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { QBinding, QEntityCollectionPath, QId, QueryObject } from "@odata2ts/odata-query-objects";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { DEFAULT_HEADERS, EntityTypeServiceV4, getODataVersionHeaders, RequestInfo, rootState } from "../../src";
import { commonEntityTypeServiceTests } from "../EntityTypeServiceTests";
import { EditablePersonModel, Feature, PersonModel } from "../fixture/PersonModel";
import { EditableFlightModel, PlanItemService } from "../fixture/v4/BaseTypeModel";
import { PersonModelService } from "../fixture/v4/PersonModelService";
import { QPersonV4 } from "../fixture/v4/QPersonV4";
import { MockClient } from "../mock/MockClient";

describe("EntityTypeService V4 Tests", () => {
  const odataClient = new MockClient(false);
  const BASE_URL = "test";
  const NAME = "test('tester')";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;

  let testService: PersonModelService;

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
    expect(result.headers).toStrictEqual({ ...DEFAULT_HEADERS, ...getODataVersionHeaders() });
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
    expect(result.headers).toStrictEqual({ ...DEFAULT_HEADERS, ...getODataVersionHeaders() });
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

  test("entityType V4: update and patch both take the updatable model, not the editable one", () => {
    type UpdateBody<Svc> = Svc extends { update: (model: infer M, ...args: any[]) => any } ? M : never;
    type PatchBody<Svc> = Svc extends { patch: (model: infer M, ...args: any[]) => any } ? M : never;

    // this service never creates an entity, so its 2nd type argument is the updatable model outright -
    // a generator not producing a separate one passes the editable model here, which is the old behaviour
    type Service = EntityTypeServiceV4<PersonModel, EditablePersonModel, QPersonV4, "4.0">;
    expectTypeOf<UpdateBody<Service>>().toEqualTypeOf<ODataModelPayloadV4<EditablePersonModel>>();
    expectTypeOf<PatchBody<Service>>().toEqualTypeOf<ODataModelPayloadV4<Partial<EditablePersonModel>>>();

    // where a type does have immutable properties, PUT drops them just as PATCH does
    interface UpdatablePerson extends Omit<EditablePersonModel, "userName"> {}
    type NarrowedService = EntityTypeServiceV4<PersonModel, UpdatablePerson, QPersonV4, "4.0">;
    expectTypeOf<UpdateBody<NarrowedService>>().toEqualTypeOf<ODataModelPayloadV4<UpdatablePerson>>();
    expectTypeOf<PatchBody<NarrowedService>>().toEqualTypeOf<ODataModelPayloadV4<Partial<UpdatablePerson>>>();
  });

  test("entityType V4: patch with select/expand", async () => {
    const unencodedService = new PersonModelService(odataClient, BASE_URL, NAME, { noUrlEncoding: true });
    const model: Partial<PersonModel> = { age: "45" };

    const request = unencodedService.patch(model, undefined, (b) => b.select("age"));

    expect(request.getInfo().url).toBe(EXPECTED_PATH + "?$select=Age");
    expect(request.getInfo().method).toBe("PATCH");
  });

  test("entityType V4: update with select/expand", async () => {
    const unencodedService = new PersonModelService(odataClient, BASE_URL, NAME, { noUrlEncoding: true });
    const model: EditablePersonModel = {
      userName: "tester",
      age: "14",
      favFeature: Feature.Feature1,
      features: [Feature.Feature1],
    };

    const request = unencodedService.update(model, undefined, (b) =>
      b.expanding("bestFriend", (nested) => nested.select("age")),
    );

    expect(request.getInfo().url).toBe(EXPECTED_PATH + "?$expand=BestFriend($select=Age)");
    expect(request.getInfo().method).toBe("PUT");
  });

  test("entityType V4: update returns a builder-backed Cmd, addToQuery works", async () => {
    const unencodedService = new PersonModelService(odataClient, BASE_URL, NAME, { noUrlEncoding: true });
    const model: EditablePersonModel = {
      userName: "tester",
      age: "14",
      favFeature: Feature.Feature1,
      features: [Feature.Feature1],
    };

    const request = unencodedService.update(model).addToQuery((b) => b.select("age"));

    expect(request.getInfo().url).toBe(EXPECTED_PATH + "?$select=Age");
    expect(request.getInfo().method).toBe("PUT");
    expect(request.getInfo().data).toEqual(model);
  });

  test("entityType V4: update query builder only allows select/expand/expanding", () => {
    testService.update({} as EditablePersonModel, undefined, (b, q) => {
      // @ts-expect-error: filter is not available for a single-model write response builder
      b.filter(q.age.gt("1"));
      // @ts-expect-error: top is not available for a single-model write response builder
      b.top(1);
    });
  });

  test("entityType V4: patch & update subtype with select/expand respects cast path", async () => {
    const serviceToTest = new PlanItemService(odataClient, BASE_URL, NAME, { noUrlEncoding: true }).asFlightService();
    const inputModel: EditableFlightModel = {
      id: 123,
      name: "Optional",
      flightNumber: "F123",
    };

    const request = serviceToTest.update(inputModel, { withCastPathSegment: true }, (b) => b.select("name"));

    expect(request.getInfo().url).toBe(EXPECTED_PATH + "/Tester.Flight?$select=Name");
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

  test("entityType V4: OData 4.01 declares the version and uses the short form of the type control info", async () => {
    const serviceToTest = new PlanItemService(odataClient, BASE_URL, NAME, {
      odataVersionV4: "4.01",
    }).asFlightService();
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

    const request = serviceToTest
      .patch(inputModel, { withCastPathSegment: true, withTypeControlInfo: true })
      .getInfoConverted();

    expect(request.data).toEqual({ ...odataModel, "@type": "#Tester.Flight" });
    expect(request.headers).toStrictEqual({ ...DEFAULT_HEADERS, ...getODataVersionHeaders("4.01") });
  });

  test("entityType V4: payload control info is either prefixed or short, never both", async () => {
    // note: a model which declares control information itself (as EditableFlightModel does) can only be
    // spread into the spelling it declares - generated models never declare any, so this is not a concern
    const person: EditablePersonModel = {
      userName: "tester",
      age: "14",
      favFeature: Feature.Feature1,
      features: [Feature.Feature1],
    };

    // each form on its own is a valid payload
    const prefixed: FlexibleODataModelPayloadV4<EditablePersonModel> = { ...person, "@odata.type": "#Tester.Person" };
    const short: FlexibleODataModelPayloadV4<EditablePersonModel> = { ...person, "@type": "#Tester.Person" };

    const bothSpellings = { ...person, "@odata.type": "#Tester.Person", "@type": "#Tester.Person" };
    // @ts-expect-error: mixing the two spellings does not describe any real payload
    const mixed: FlexibleODataModelPayloadV4<EditablePersonModel> = bothSpellings;

    expect(prefixed["@odata.type"]).toBe("#Tester.Person");
    expect(short["@type"]).toBe("#Tester.Person");
    expect(mixed).toBeDefined();
  });

  test("entityType V4: control info supplied by the user is not overwritten", async () => {
    const serviceToTest = new PlanItemService(odataClient, BASE_URL, NAME).asFlightService();
    const inputModel: EditableFlightModel = { id: 123, name: "Optional", flightNumber: "F123" };

    const request = serviceToTest
      .patch({ ...inputModel, "@odata.type": "#Tester.SomethingElse" }, { withTypeControlInfo: true })
      .getInfoConverted();

    expect(request.data["@odata.type"]).toBe("#Tester.SomethingElse");
  });

  test("entityType V4: big number", async () => {
    testService = new PersonModelService(odataClient, BASE_URL, NAME, { bigNumbersAsString: true });

    const request = testService.query().getInfo();

    expect(request.headers).toStrictEqual({
      Accept: "application/json;IEEE754Compatible=true",
      "Content-Type": "application/json;IEEE754Compatible=true",
    });
  });

  test("operation V4: model return type is run through the response converter", async () => {
    const odataModel = { UserName: "russell", Age: 45, FavFeature: "Feature1", Features: ["Feature1"] };
    const expected = {
      userName: "russell",
      age: "45", // number -> string via converter
      favFeature: Feature.Feature1,
      features: [Feature.Feature1],
    };

    odataClient.setModelResponse(odataModel);
    const response = await testService
      .getSomething({ testGuid: { prefix: "xxx", value: "123" }, testDateTime: "1", testDateTimeO: "2", testTime: "3" })
      .execute();

    expect(response.data).toStrictEqual(expected);
    // operations keep the response type the generator emitted, here 4.0
    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<PersonModel>>>();
  });

  test("operation V4: value return type is run through the response converter", async () => {
    // server delivers a number, the converter turns it into a string
    odataClient.setValueResponse(45);
    const response = await testService.getScore().execute();

    expect(response.data?.value).toBe("45");
  });

  describe("cache keys: expand enrichment and deepEdit", () => {
    const PERSON = "Test.Person";

    /**
     * `QPersonV4`'s own `friends` (the shared fixture) has no `QBinding` at all, so it is unsuitable for
     * proving deepEdit finds the *deep-inserted* entity set, not the parent's own - a distinct, purpose-built
     * Q-object is used instead of reshaping the shared fixture. Its field is deliberately named "friends"
     * (matching the payload's own TS-facing name) while its wire name ("Friends") and bound entity set
     * ("Trips") both differ from it, exercising that indexing and identity are two separate lookups.
     */
    class QTrip extends QueryObject {}
    class QPersonWithTripFriends extends QueryObject {
      public readonly friends = new QEntityCollectionPath(
        this.withPrefix("Friends"),
        () => QTrip,
        new QBinding(() => ({ getName: () => "Trips" }) as unknown as QId<any>, "4.0"),
      );
    }

    test("query() enriches expand entries by reading the property's own name and kind directly off the Q-object - no table needed", async () => {
      const service = new PersonModelService(odataClient, BASE_URL, NAME, undefined, rootState(PERSON, "detail"));
      const request = service.query((b) => b.expand("friends"));
      expect(request.cacheKey).toEqual([PERSON, "detail", { expand: [["Friends", "list"]] }]);
    });

    test("patch() attaches deepEdit to invalidates when the payload deep-inserts a nav property", async () => {
      const TRIPS = "Trips";
      const service = new PersonModelService(
        odataClient,
        BASE_URL,
        NAME,
        undefined,
        rootState(PERSON, "detail", { entitySetName: PERSON, qEntityFn: () => QPersonWithTripFriends as any }),
      );
      const model = {
        age: "45",
        friends: [{ userName: "buddy", age: "15", favFeature: Feature.Feature1, features: [] }],
      } as unknown as Partial<EditablePersonModel>;

      const response = await service.patch(model).ignoreETag().execute();
      expect(response.invalidates).toEqual([
        [PERSON, "detail"],
        [PERSON, "list"],
        [TRIPS, "list"],
      ]);
    });
  });
});
