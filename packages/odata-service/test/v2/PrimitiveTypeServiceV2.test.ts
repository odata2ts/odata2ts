import { beforeEach, describe, expect, test } from "vitest";
import { PrimitiveTypeServiceV2 } from "../../src";
import { PersonModelV2Service } from "../fixture/v2/PersonModelV2Service";
import { MockClient } from "../mock/MockClient";

describe("PrimitiveTypeService V2 Test", () => {
  const odataClient = new MockClient(true);
  const BASE_URL = "path";
  const NAME = "test('tester')";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}/UserName`;

  let testService: PrimitiveTypeServiceV2<MockClient, string>;

  beforeEach(() => {
    testService = new PersonModelV2Service(odataClient, BASE_URL, NAME).userName();
  });

  test("primitiveType V2: base tests", () => {
    expect(testService.getPath()).toBe(EXPECTED_PATH);
  });

  test("primitiveType V2: get value", async () => {
    const request = testService.getValue().getInfo();

    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("GET");
  });

  test("primitiveType V2: update value", async () => {
    const value = "test";
    const cmd = testService.updateValue(value);
    const request = cmd.getInfo();

    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.data).toEqual(value);
    expect(cmd.getInfoConverted().data).toEqual({ UserName: "test" });
    expect(request.method).toBe("PUT");
  });

  test("primitiveType V2: delete value", async () => {
    const request = testService.deleteValue().getInfo();

    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("DELETE");
  });
});
