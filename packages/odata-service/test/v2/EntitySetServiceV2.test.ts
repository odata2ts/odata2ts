import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataEntityModelResponseV2 } from "@odata2ts/odata-core";
import { QBinding, QEntityCollectionPath, QId, QueryObject } from "@odata2ts/odata-query-objects";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { DEFAULT_HEADERS, RequestInfo, rootState } from "../../src";
import { commonEntitySetTests } from "../EntitySetServiceTests";
import { EditablePersonModel, Feature, PersonModel } from "../fixture/PersonModel";
import { PersonModelV2CollectionService } from "../fixture/v2/PersonModelV2Service";
import { MockClient } from "../mock/MockClient";

describe("V2 EntitySetService Test", () => {
  const odataClient = new MockClient(true);
  const BASE_URL = "/base";
  const NAME = "test";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;

  let testService: PersonModelV2CollectionService;

  commonEntitySetTests(odataClient, PersonModelV2CollectionService);

  beforeEach(() => {
    testService = new PersonModelV2CollectionService(odataClient, BASE_URL, NAME);
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

    // odataClient.setModelResponse(odataModel);
    const request = testService.create(model);
    const result = request.getInfo();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.method).toBe("POST");
    expect(result.headers).toStrictEqual(DEFAULT_HEADERS);
    expect(result.data).toStrictEqual(model);
    expect(request.getInfoConverted().data).toStrictEqual(odataModel);
    expectTypeOf(result).toEqualTypeOf<RequestInfo<EditablePersonModel>>();

    // check response conversion
    odataClient.setModelResponse(odataModel);
    const response = await request.execute();

    expect(response.data).toStrictEqual({ d: model });
    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<ODataEntityModelResponseV2<PersonModel>>>();
  });

  test("entitySet: create with select/expand", async () => {
    const unencodedService = new PersonModelV2CollectionService(odataClient, BASE_URL, NAME, {
      noUrlEncoding: true,
    });
    const model: EditablePersonModel = {
      userName: "tester",
      age: "14",
      favFeature: Feature.Feature1,
      features: [Feature.Feature1],
    };

    const request = unencodedService.create(model, (b) => b.select("userName"));

    expect(request.getInfo().url).toBe(EXPECTED_PATH + "?$select=UserName");
    expect(request.getInfo().method).toBe("POST");
  });

  test("entitySet: create returns a builder-backed Cmd, addToQuery works", async () => {
    const unencodedService = new PersonModelV2CollectionService(odataClient, BASE_URL, NAME, {
      noUrlEncoding: true,
    });
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

  describe("cache keys: expand enrichment and deepEdit", () => {
    const PERSON = "Test.Person";

    /**
     * The shared fixture's own `friends` has no `QBinding` at all, so it is unsuitable for proving deepEdit
     * finds the *deep-inserted* entity set, not the parent's own - a distinct, purpose-built Q-object is
     * used instead of reshaping the shared fixture. Its field is deliberately named "friends" (matching the
     * payload's own TS-facing name) while its wire name ("Friends") and bound entity set ("Trips") both
     * differ from it, exercising that indexing and identity are two separate lookups.
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
      const service = new PersonModelV2CollectionService(
        odataClient,
        BASE_URL,
        NAME,
        undefined,
        rootState(PERSON, "list"),
      );
      const request = service.query((b) => b.expand("friends"));
      expect(request.cacheKey).toEqual([PERSON, "list", { expand: [["Friends", "list"]] }]);
    });

    test("create() attaches deepEdit to invalidates when the payload deep-inserts a nav property", async () => {
      const TRIPS = "Trips";
      const service = new PersonModelV2CollectionService(
        odataClient,
        BASE_URL,
        NAME,
        undefined,
        rootState(PERSON, "list", { qEntityFn: () => QPersonWithTripFriends as any }),
      );
      const model = {
        userName: "tester",
        age: "14",
        favFeature: Feature.Feature1,
        features: [Feature.Feature1],
        friends: [{ userName: "buddy", age: "15", favFeature: Feature.Feature1, features: [] }],
      } as unknown as EditablePersonModel;

      const response = await service.create(model).execute();
      expect(response.invalidates).toEqual([
        [PERSON, "list"],
        [TRIPS, "list"],
      ]);
    });
  });
});
