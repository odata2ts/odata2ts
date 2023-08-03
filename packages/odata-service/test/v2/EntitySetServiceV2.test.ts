import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2 } from "@odata2ts/odata-core";
import { ODataQueryBuilderV2 } from "@odata2ts/odata-query-builder";

import { DEFAULT_HEADERS } from "../../src/RequestHeaders";
import { commonEntitySetTests } from "../EntitySetServiceTests";
import { EditablePersonModel, Feature, PersonModel } from "../fixture/PersonModel";
import { PersonModelV2CollectionService } from "../fixture/v2/PersonModelV2Service";
import { QPersonV2 } from "../fixture/v2/QPersonV2";
import { MockClient } from "../mock/MockClient";

describe("V2 EntitySetService Test", () => {
  const odataClient = new MockClient(true);
  const BASE_URL = "/base";
  const NAME = "test";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;
  const REQUEST_CONFIG = { test: "Test" };

  let testService: PersonModelV2CollectionService<MockClient>;

  commonEntitySetTests(odataClient, PersonModelV2CollectionService);

  beforeEach(() => {
    testService = new PersonModelV2CollectionService(odataClient, BASE_URL, NAME);
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
  });

  test("entitySet V2: ensure query typings", async () => {
    // just a typing test: this only needs to compile
    const result: HttpResponseModel<ODataCollectionResponseV2<PersonModel>> = await testService.query((builder) => {
      const bResult: ODataQueryBuilderV2<QPersonV2> = builder;
    });

    // manual typings provided
    const result2: HttpResponseModel<ODataCollectionResponseV2<{ userName: string }>> = await testService.query<
      Pick<PersonModel, "userName">
    >((builder) => {
      const bResult: ODataQueryBuilderV2<QPersonV2> = builder;
    });
  });
});
