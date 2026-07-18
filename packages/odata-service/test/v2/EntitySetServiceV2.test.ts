import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataEntityModelResponseV2 } from "@odata2ts/odata-core";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { DEFAULT_HEADERS, RequestInfo } from "../../src";
import { commonEntitySetTests } from "../EntitySetServiceTests";
import { EditablePersonModel, Feature, PersonModel } from "../fixture/PersonModel";
import { PersonModelV2CollectionService } from "../fixture/v2/PersonModelV2Service";
import { MockClient } from "../mock/MockClient";

describe("V2 EntitySetService Test", () => {
  const odataClient = new MockClient(true);
  const BASE_URL = "/base";
  const NAME = "test";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;

  let testService: PersonModelV2CollectionService<MockClient>;

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
});
