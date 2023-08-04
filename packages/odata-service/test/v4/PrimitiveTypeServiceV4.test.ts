import { PrimitiveTypeServiceV4 } from "../../src";
import { PersonModelService } from "../fixture/v4/PersonModelService";
import { MockClient } from "../mock/MockClient";

describe("PrimitiveTypeService V4 Test", () => {
  const odataClient = new MockClient(true);
  const BASE_URL = "path";
  const NAME = "test('tester')";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}/UserName`;

  const REQUEST_CONFIG = { test: "Test" };

  let testService: PrimitiveTypeServiceV4<MockClient, string>;

  beforeEach(() => {
    testService = new PersonModelService(odataClient, BASE_URL, NAME).userName();
  });

  test("primitiveType V4: base tests", () => {
    expect(testService.getPath()).toBe(EXPECTED_PATH);
  });

  test("primitiveType V4: get value", async () => {
    const value = await testService.getValue();

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastRequestConfig).toBeUndefined();
  });

  test("primitiveType V4: get value with request config", async () => {
    const value = await testService.getValue(REQUEST_CONFIG);

    expect(odataClient.lastRequestConfig).toStrictEqual(REQUEST_CONFIG);
  });

  test("primitiveType V4: update value", async () => {
    const value = await testService.updateValue("test");

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastData).toStrictEqual({ value: "test" });
    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastRequestConfig).toBeUndefined();
  });

  test("primitiveType V4: update value with request config", async () => {
    const value = await testService.updateValue("test", REQUEST_CONFIG);

    expect(odataClient.lastRequestConfig).toStrictEqual(REQUEST_CONFIG);
  });

  test("primitiveType V4: delete value", async () => {
    const value = await testService.deleteValue();

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastRequestConfig).toBeUndefined();
  });

  test("primitiveType V4: delete value with request config", async () => {
    const value = await testService.deleteValue(REQUEST_CONFIG);

    expect(odataClient.lastRequestConfig).toStrictEqual(REQUEST_CONFIG);
  });
});
