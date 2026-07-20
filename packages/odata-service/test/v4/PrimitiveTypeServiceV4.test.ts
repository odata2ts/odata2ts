import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { PrimitiveTypeServiceV4, RequestInfo } from "../../src/";
import { PersonModelService } from "../fixture/v4/PersonModelService";
import { MockClient } from "../mock/MockClient";

describe("PrimitiveTypeService V4 Test", () => {
  const odataClient = new MockClient(false);
  const BASE_URL = "path";
  const NAME = "test('tester')";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}/UserName`;

  let service: PrimitiveTypeServiceV4<MockClient, string>;
  // with number to string converter
  let serviceConv: PrimitiveTypeServiceV4<MockClient, string>;

  beforeEach(() => {
    const personService = new PersonModelService(odataClient, BASE_URL, NAME);
    service = personService.userName();
    serviceConv = personService.age();
  });

  test("primitiveType V4: base tests", () => {
    expect(service.getPath()).toBe(EXPECTED_PATH);
  });

  test("primitiveType V4: defaults to identity converter when none is given", async () => {
    const defaultService = new PrimitiveTypeServiceV4<MockClient, string>(odataClient, BASE_URL, NAME);

    odataClient.setValueResponse("tester");
    const response = await defaultService.getValue().execute();

    expect(response.data?.value).toBe("tester");
  });

  test("primitiveType V4: get value", async () => {
    const request = service.getValue();
    const result = request.getInfo();

    expectTypeOf(result).toEqualTypeOf<RequestInfo>();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.data).toBeUndefined();
    expect(result.method).toBe("GET");
    expect(odataClient.lastRequestConfig).toBeUndefined();

    expectTypeOf(await request.execute()).toEqualTypeOf<HttpResponseModel<ODataValueResponseV4<string> | undefined>>();
  });

  test("primitiveType V4: get value with converter", async () => {
    const request = serviceConv.getValue();

    odataClient.setValueResponse(3);
    const response = await request.execute();

    expect(response.data?.value).toBe("3");
    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<ODataValueResponseV4<string> | undefined>>();
  });

  test("primitiveType V4: update value", async () => {
    const value = "test";
    const request = service.updateValue(value);
    const result = request.getInfoConverted();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.data).toStrictEqual({ value });
    expect(result.method).toBe("PUT");
    expect(odataClient.lastRequestConfig).toBeUndefined();

    expectTypeOf(request.getInfo()).toEqualTypeOf<RequestInfo<string>>();

    expectTypeOf(await service.updateValue(value).execute()).toEqualTypeOf<HttpResponseModel<undefined>>();
    expectTypeOf(await service.updateValue<false>(value).execute()).toEqualTypeOf<HttpResponseModel<undefined>>();

    // check response
    odataClient.setValueResponse(value);
    const response = await service.updateValue<true>(value).execute();

    expect(response.data).toStrictEqual({ value });
    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<ODataValueResponseV4<string>>>();
  });

  test("primitiveType V4: update value with converter", async () => {
    const value = "11";
    const request = serviceConv.updateValue(value);

    expectTypeOf(request.getInfo()).toEqualTypeOf<RequestInfo<string>>();
    expect(request.getInfoConverted().data).toStrictEqual({ value: 11 });

    odataClient.setValueResponse(11);
    const response = await serviceConv.updateValue<true>(value).execute();

    expect(response.data).toStrictEqual({ value });
    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<ODataValueResponseV4<string>>>();
  });

  test("primitiveType V4: delete value", async () => {
    const request = service.deleteValue();
    const result = request.getInfo();

    expectTypeOf(result).toEqualTypeOf<RequestInfo>();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.data).toBeUndefined();
    expect(result.method).toBe("DELETE");
    expect(odataClient.lastRequestConfig).toBeUndefined();

    expectTypeOf(await request.execute()).toEqualTypeOf<HttpResponseModel<undefined>>();
  });
});
