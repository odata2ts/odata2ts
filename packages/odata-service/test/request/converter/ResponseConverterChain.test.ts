import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { ResponseDataConverter, ValueResponseConverterV4 } from "@odata2ts/odata-query-objects";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { ResponseConverterChain } from "../../../src";

describe("ResponseConverterChain tests", () => {
  const DEFAULT_STATUS = 200;
  const DEFAULT_STATUS_TEXT = "OK";
  const DEFAULT_HEADER = { x: "y" };
  const DEFAULT_DATA = "41";

  const testResponseDataConverter: ResponseDataConverter<number> = {
    convertFrom: (value: any) => {
      return Number(value) + 1;
    },
  };

  let blankCandidate: ResponseConverterChain<string>;
  let testCandidate: ResponseConverterChain<ODataValueResponseV4<number>>;
  let testResponse: HttpResponseModel<ODataValueResponseV4<string>>;

  beforeEach(() => {
    blankCandidate = new ResponseConverterChain();
    testCandidate = new ResponseConverterChain(new ValueResponseConverterV4(testResponseDataConverter));
    testResponse = {
      status: DEFAULT_STATUS,
      statusText: DEFAULT_STATUS_TEXT,
      headers: DEFAULT_HEADER,
      data: { value: DEFAULT_DATA },
    };
  });

  test("regular conversion", () => {
    const blankResult = blankCandidate.convert(testResponse);
    const result = testCandidate.convert(testResponse);

    expectTypeOf(blankResult).toEqualTypeOf<HttpResponseModel<string>>();
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataValueResponseV4<number>>>();

    expect(blankResult).toStrictEqual(testResponse);
    expect(result).toStrictEqual({
      ...testResponse,
      data: { value: 42 },
    });
  });

  test("prepend custom converter", () => {
    const blankResult = blankCandidate
      .prependConverter((response) => ({ ...response, data: "xxx" }))
      .convert(testResponse);
    const result = testCandidate
      .prependConverter((response) => ({ ...response, data: { value: "0" } }))
      .convert(testResponse);

    expectTypeOf(blankResult).toEqualTypeOf<HttpResponseModel<string>>();
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataValueResponseV4<number>>>();

    expect(blankResult).toStrictEqual({ ...testResponse, data: "xxx" });
    expect(result).toStrictEqual({ ...testResponse, data: { value: 1 } });
  });

  test("prepend multiple times", () => {
    expect(
      testCandidate
        .prependConverter((response) => ({ ...response, data: { value: "0" } }))
        .prependConverter((response) => ({ ...response, data: { value: response.data.value, foo: "bar" } }))
        .convert(testResponse),
    ).toStrictEqual({ ...testResponse, data: { value: 1, foo: "bar" } });
  });

  test("append custom converter", () => {
    const blankResult = blankCandidate
      .appendConverter((response) => ({ ...response, data: "xxx" }))
      .convert(testResponse);
    const result = testCandidate
      .appendConverter<string>((response) => ({ ...response, data: String(response.data.value) }))
      .convert(testResponse);

    expectTypeOf(blankResult).toEqualTypeOf<HttpResponseModel<string>>();
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<string>>();

    expect(blankResult).toStrictEqual({ ...testResponse, data: "xxx" });
    expect(result).toStrictEqual({ ...testResponse, data: "42" });
  });

  test("append multiple times", () => {
    const result = testCandidate
      .appendConverter<string>((response) => ({ ...response, data: String(response.data.value) }))
      .appendConverter<{ v: string }>((response) => ({ ...response, data: { v: response.data } }))
      .convert(testResponse);

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<{ v: string }>>();

    expect(result).toStrictEqual({ ...testResponse, data: { v: "42" } });
  });

  test("mixed append and prepend", () => {
    const result = testCandidate
      .prependConverter((response) => ({ ...response, data: { value: "0" } }))
      .appendConverter<{ v: string }>((response) => {
        const { value, ...data } = response.data;
        return { ...response, data: { ...data, v: String(value) } };
      })
      .prependConverter((response) => ({ ...response, data: { value: response.data.value, foo: "bar" } }))
      .convert(testResponse);

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<{ v: string }>>();

    expect(result).toStrictEqual({ ...testResponse, data: { v: "1", foo: "bar" } });
  });
});
