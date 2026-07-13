import { beforeEach, describe, expect, test } from "vitest";
import { DEFAULT_HEADERS } from "../../src";
import { commonEntitySetTests } from "../EntitySetServiceTests";
import { EditablePersonModel, Feature } from "../fixture/PersonModel";
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
    const cmd = testService.create(model);
    let request = cmd.getInfo();

    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.method).toBe("POST");
    expect(request.headers).toStrictEqual(DEFAULT_HEADERS);
    expect(request.data).toStrictEqual(model);
    expect(cmd.getInfoConverted().data).toStrictEqual(odataModel);
  });
});
