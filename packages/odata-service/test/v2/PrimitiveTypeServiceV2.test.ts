import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataValueResponseV2 } from "@odata2ts/odata-core";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { PrimitiveTypeServiceV2, RequestInfo } from "../../src";
import { PersonModelV2Service } from "../fixture/v2/PersonModelV2Service";
import { MockClient } from "../mock/MockClient";

describe("PrimitiveTypeService V2 Test", () => {
  const odataClient = new MockClient(true);
  const BASE_URL = "path";
  const NAME = "test('tester')";
  const PROPERTY_NAME = "UserName";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}/${PROPERTY_NAME}`;

  let testService: PrimitiveTypeServiceV2<MockClient, string>;

  beforeEach(() => {
    testService = new PersonModelV2Service(odataClient, BASE_URL, NAME).userName();
  });

  test("primitiveType V2: base tests", () => {
    expect(testService.getPath()).toBe(EXPECTED_PATH);
  });

  test("primitiveType V2: internal converter name and mapped name", () => {
    const converter = (testService as any).__converter;

    expect(converter.getName()).toBe(PROPERTY_NAME);
    expect(converter.getMappedName()).toBe("userName");
  });

  test("primitiveType V2: internal converter without mapped name falls back to name", () => {
    const noMappedNameService = new PrimitiveTypeServiceV2<MockClient, string>(odataClient, BASE_URL, NAME);
    const converter = (noMappedNameService as any).__converter;

    expect(converter.getMappedName()).toBe(NAME);
  });

  test("primitiveType V2: internal converter with explicit mapped name", () => {
    const mappedService = new PrimitiveTypeServiceV2<MockClient, string>(
      odataClient,
      BASE_URL,
      NAME,
      undefined,
      "mappedUserName",
    );
    const converter = (mappedService as any).__converter;

    expect(converter.getName()).toBe(NAME);
    expect(converter.getMappedName()).toBe("mappedUserName");
  });

  test("primitiveType V2: get value", async () => {
    const request = testService.getValue();
    const result = request.getInfo();

    expectTypeOf(result).toEqualTypeOf<RequestInfo>();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.data).toBeUndefined();
    expect(result.method).toBe("GET");
    expect(result).toStrictEqual(request.getInfoConverted());

    expectTypeOf(await request.execute()).toEqualTypeOf<HttpResponseModel<ODataValueResponseV2<string>>>();
  });

  test("primitiveType V2: update value", async () => {
    const value = "test";
    const request = testService.updateValue(value);
    const result = request.getInfo();

    expectTypeOf(result).toEqualTypeOf<RequestInfo<string>>();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.data).toEqual(value);
    expect(request.getInfoConverted().data).toEqual({ UserName: "test" });
    expect(result.method).toBe("PUT");

    expectTypeOf(await request.execute()).toEqualTypeOf<HttpResponseModel<undefined>>();
  });

  test("primitiveType V2: delete value", async () => {
    const request = testService.deleteValue();
    const result = request.getInfo();

    expectTypeOf(result).toEqualTypeOf<RequestInfo>();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.data).toBeUndefined();
    expect(result.method).toBe("DELETE");

    expectTypeOf(await request.execute()).toEqualTypeOf<HttpResponseModel<undefined>>();
  });
});
