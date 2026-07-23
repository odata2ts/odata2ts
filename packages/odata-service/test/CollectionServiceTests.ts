import { HttpResponseModel } from "@odata2ts/http-client-api";
import { beforeEach, expect, expectTypeOf, test } from "vitest";
import { DEFAULT_HEADERS } from "../src";
import {
  EnumCollectionService,
  EnumCollectionServiceConstructor,
  StringCollectionService,
  StringCollectionServiceConstructor,
} from "./fixture/PersonModel";

export function getParams(params: { [key: string]: string }) {
  const ps = Object.entries(params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  return `?${ps.join("&")}`;
}

export function commonCollectionTests(
  stringCollectionServiceConstructor: StringCollectionServiceConstructor,
  enumCollectionServiceConstructor: EnumCollectionServiceConstructor,
) {
  const BASE_URL = "/test";
  const NAME_STRING = "Name";
  const STRING_URL = `${BASE_URL}/${NAME_STRING}`;
  const NAME_ENUM = "Feature";
  const ENUM_URL = `${BASE_URL}/${NAME_ENUM}`;

  let stringService: StringCollectionService;
  let enumService: EnumCollectionService;

  beforeEach(() => {
    stringService = stringCollectionServiceConstructor(BASE_URL, NAME_STRING);
    enumService = enumCollectionServiceConstructor(BASE_URL, NAME_ENUM);
  });

  test("collection: no patch", async () => {
    // @ts-expect-error
    expect(stringService.patch).toBeUndefined();
  });

  test("collection: getPath", () => {
    expect(stringService.getPath()).toBe(STRING_URL);
    expect(enumService.getPath()).toBe(ENUM_URL);
  });

  test("collection: delete", async () => {
    const request = stringService.delete();
    const result = request.getInfo();

    expect(result.url).toBe(STRING_URL);
    expect(result.method).toBe("DELETE");
    expect(result.data).toBeUndefined();

    expectTypeOf(await request.execute()).toEqualTypeOf<HttpResponseModel<undefined>>();
  });

  test("collection: query", async () => {
    let request = stringService.query().getInfo();

    expect(request.url).toBe(STRING_URL);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("GET");
    expect(request.headers).toStrictEqual(DEFAULT_HEADERS);

    request = enumService.query(undefined).getInfo();
    expect(request.url).toBe(ENUM_URL);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("GET");
    expect(request.headers).toStrictEqual(DEFAULT_HEADERS);
  });

  test("collection: skip & top, but no select, expand", async () => {
    const params = getParams({ $top: "2", $skip: "1" });
    const expectedString = STRING_URL + params;
    const expectedEnum = ENUM_URL + params;

    let request = stringService
      .query((queryBuilder) => {
        queryBuilder.skip(1).top(2);
      })
      .getInfo();

    expect(request.url).toBe(expectedString);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("GET");

    request = enumService
      .query((queryBuilder) => {
        queryBuilder.skip(1).top(2);
      })
      .getInfo();

    expect(request.url).toBe(expectedEnum);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("GET");
  });

  test("collection: filter", async () => {
    const params = getParams({ $filter: "$it eq 'hi'" });
    const expectedString = STRING_URL + params;

    const request = stringService.query((queryBuilder, qObj) => queryBuilder.filter(qObj.it.eq("hi"))).getInfo();
    expect(request.url).toBe(expectedString);
  });

  test("collection: no url encoding", async () => {
    const toTest = stringCollectionServiceConstructor(BASE_URL, NAME_STRING, { noUrlEncoding: true });

    const request = toTest.query((qb, q) => qb.filter(q.it.eq("2"))).getInfo();

    expect(request.url).toBe(STRING_URL + "?$filter=$it eq '2'");
  });
}
