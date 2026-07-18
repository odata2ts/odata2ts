import { HttpResponseModel } from "@odata2ts/http-client-api";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { DEFAULT_HEADERS, MERGE_HEADERS } from "../../src";
import { EditablePersonModel, Feature, PersonModel } from "../fixture/PersonModel";
import { FakedComplexServiceV2 } from "../fixture/v2/FakedComplexServiceV2";
import { MockClient } from "../mock/MockClient";

describe("ComplexTypeService V2 Test", () => {
  const odataClient = new MockClient(true);
  const BASE_URL = "path";
  const NAME = "test('tester')";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;

  let testService: FakedComplexServiceV2<MockClient>;

  beforeEach(() => {
    testService = new FakedComplexServiceV2(odataClient, BASE_URL, NAME);
  });

  test("complexType: patch = merge", async () => {
    const model: Partial<PersonModel> = { age: "45" };
    const odataModel = { Age: 45 };

    const request = testService.patch(model);
    const result = request.getInfo();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.method).toBe("POST");
    expect(result.data).toStrictEqual(model);
    expect(request.getInfoConverted().data).toStrictEqual(odataModel);
    expect(result.headers).toStrictEqual({ ...DEFAULT_HEADERS, ...MERGE_HEADERS });

    expectTypeOf(await request.execute()).toEqualTypeOf<HttpResponseModel<undefined>>();
  });

  test("entityType: update", async () => {
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

    const request = testService.update(model);
    const result = request.getInfo();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.method).toBe("PUT");
    expect(result.headers).toStrictEqual(DEFAULT_HEADERS);
    expect(result.data).toEqual(model);
    expect(request.getInfoConverted().data).toEqual(odataModel);

    expectTypeOf(await request.execute()).toEqualTypeOf<HttpResponseModel<undefined>>();
  });
});
