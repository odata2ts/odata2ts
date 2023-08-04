import { PrimitiveTypeServiceV2 } from "../../src";
import { PersonModelV2Service } from "../fixture/v2/PersonModelV2Service";
import { MockClient } from "../mock/MockClient";

describe("PrimitiveTypeService V2 Test", () => {
  const odataClient = new MockClient(true);
  const BASE_URL = "path";
  const NAME = "test('tester')";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}/UserName`;

  const REQUEST_CONFIG = { test: "Test" };

  let testService: PrimitiveTypeServiceV2<MockClient, string>;

  beforeEach(() => {
    testService = new PersonModelV2Service(odataClient, BASE_URL, NAME).userName();
  });

  test("primitiveType V2: base tests", () => {
    expect(testService.getPath()).toBe(EXPECTED_PATH);
  });

  test("primitiveType V2: get value", async () => {
    const value = await testService.getValue();

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("GET");
    expect(odataClient.lastRequestConfig).toBeUndefined();
  });

  test("primitiveType V2: get value with request config", async () => {
    const value = await testService.getValue(REQUEST_CONFIG);

    expect(odataClient.lastRequestConfig).toStrictEqual(REQUEST_CONFIG);
  });

  test("primitiveType V2: update value", async () => {
    const value = await testService.updateValue("test");

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastData).toStrictEqual({ UserName: "test" });
    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastRequestConfig).toBeUndefined();
  });

  test("primitiveType V2: update value with request config", async () => {
    const value = await testService.updateValue("test", REQUEST_CONFIG);

    expect(odataClient.lastRequestConfig).toStrictEqual(REQUEST_CONFIG);
  });

  test("primitiveType V2: delete value", async () => {
    const value = await testService.deleteValue();

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastData).toBeUndefined();
    expect(odataClient.lastOperation).toBe("DELETE");
    expect(odataClient.lastRequestConfig).toBeUndefined();
  });

  test("primitiveType V2: delete value with request config", async () => {
    const value = await testService.deleteValue(REQUEST_CONFIG);

    expect(odataClient.lastRequestConfig).toStrictEqual(REQUEST_CONFIG);
  });
});
