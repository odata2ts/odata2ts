import { beforeEach, describe, expect, test } from "vitest";
import { DEFAULT_HEADERS, MERGE_HEADERS } from "../../src";
import { commonEntityTypeServiceTests } from "../EntityTypeServiceTests";
import { PersonModel } from "../fixture/PersonModel";
import { PersonModelV2Service } from "../fixture/v2/PersonModelV2Service";
import { MockClient } from "../mock/MockClient";

describe("EntityTypeService V2 Test", () => {
  const odataClient = new MockClient(true);
  const BASE_URL = "path";
  const NAME = "test('tester')";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;

  let testService: PersonModelV2Service<MockClient>;

  commonEntityTypeServiceTests(odataClient, PersonModelV2Service);

  beforeEach(() => {
    testService = new PersonModelV2Service(odataClient, BASE_URL, NAME);
  });

  test("entityType: patch = merge", async () => {
    const model: Partial<PersonModel> = { age: "45" };
    const odataModel = { Age: 45 };

    const cmd = testService.patch(model);
    const request = cmd.getInfo();

    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.method).toBe("POST");
    expect(request.data).toStrictEqual(model);
    expect(cmd.getInfoConverted().data).toStrictEqual(odataModel);
    expect(request.headers).toStrictEqual({ ...DEFAULT_HEADERS, ...MERGE_HEADERS });
  });

  test("entityType V2: function params", async () => {
    const expected =
      EXPECTED_PATH +
      "/GET_SOMETHING?TEST_GUID=guid'123'&testDateTime=datetime'1'&testDateTimeO=datetimeoffset'2'&testTime=time'3'";

    const request = testService
      .getSomething({
        testGuid: { prefix: "xxx", value: "123" },
        testDateTime: "1",
        testDateTimeO: "2",
        testTime: "3",
      })
      .getInfo();

    expect(request.url).toBe(expected);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("GET");
  });
});
