import { beforeEach, describe, expect, test } from "vitest";
import { PrimitiveTypeServiceV4 } from "../../src/";
import { PersonModelService } from "../fixture/v4/PersonModelService";
import { MockClient } from "../mock/MockClient";

describe("PrimitiveTypeService V4 Test", () => {
  const odataClient = new MockClient(true);
  const BASE_URL = "path";
  const NAME = "test('tester')";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}/UserName`;

  let testService: PrimitiveTypeServiceV4<MockClient, string>;

  beforeEach(() => {
    testService = new PersonModelService(odataClient, BASE_URL, NAME).userName();
  });

  test("primitiveType V4: base tests", () => {
    expect(testService.getPath()).toBe(EXPECTED_PATH);
  });

  test("primitiveType V4: get value", async () => {
    const request = testService.getValue().getInfo();

    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("GET");
    expect(odataClient.lastRequestConfig).toBeUndefined();
  });

  test("primitiveType V4: update value", async () => {
    const request = testService.updateValue("test").getInfoConverted();

    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.data).toStrictEqual({ value: "test" });
    expect(request.method).toBe("PUT");
    expect(odataClient.lastRequestConfig).toBeUndefined();
  });

  test("primitiveType V4: delete value", async () => {
    const request = testService.deleteValue().getInfo();

    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("DELETE");
    expect(odataClient.lastRequestConfig).toBeUndefined();
  });
});
