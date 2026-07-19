import { HttpResponseModel } from "@odata2ts/http-client-api";
import { beforeEach, expect, expectTypeOf, test } from "vitest";
import { ODataServiceOptions } from "../src";
import { PersonModelServiceVersion } from "./fixture/PersonModel";
import { MockClient } from "./mock/MockClient";

export function commonEntityTypeServiceTests(
  odataClient: MockClient,
  serviceConstructor: new (
    odataClient: MockClient,
    basePath: string,
    name: string,
    options?: ODataServiceOptions,
  ) => PersonModelServiceVersion,
) {
  const BASE_URL = "/test";
  const NAME = "EntityXY('tester')";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;
  const DEFAULT_HEADERS = { Accept: "application/json", "Content-Type": "application/json" };

  let testService: PersonModelServiceVersion;

  beforeEach(() => {
    testService = new serviceConstructor(odataClient, BASE_URL, NAME);
  });

  test("entitySet: setup", async () => {
    expect(testService.getPath()).toBe(EXPECTED_PATH);
  });

  test("entityType: query", async () => {
    const cmd = testService.query();
    const request = cmd.getInfo();

    expect(request.url).toBe(EXPECTED_PATH);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("GET");
    expect(request.headers).toStrictEqual(DEFAULT_HEADERS);
  });

  test("entityType: query with select", async () => {
    const expected = `${EXPECTED_PATH}?${encodeURIComponent("$select")}=${encodeURIComponent("UserName,Age")}`;

    const request = testService.query((queryBuilder) => queryBuilder.select("userName", "age")).getInfo();

    expect(request.url).toBe(expected);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("GET");
  });

  test("entityType: query with expand", async () => {
    const expected = `${EXPECTED_PATH}?${encodeURIComponent("$expand")}=${encodeURIComponent("BestFriend")}`;

    const request = testService.query((queryBuilder) => queryBuilder.expand("bestFriend")).getInfo();

    expect(request.url).toBe(expected);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("GET");
  });

  test("entityType: query builder doesn't allow filter/top/skip/count/orderBy", async () => {
    // $filter, $top, $skip, $count and $orderby only make sense on a collection, never on a single-entity GET,
    // so the model-cardinality query builder must not expose them.
    testService.query((queryBuilder, qObj) => {
      // @ts-expect-error: filter is not available for a single model
      queryBuilder.filter(qObj.age.gt("18"));
      // @ts-expect-error: top is not available for a single model
      queryBuilder.top(1);
      // @ts-expect-error: skip is not available for a single model
      queryBuilder.skip(1);
      // @ts-expect-error: count is not available for a single model
      queryBuilder.count();
      // @ts-expect-error: orderBy is not available for a single model
      queryBuilder.orderBy(qObj.age.asc());
      return queryBuilder;
    });
  });

  test("entityType: no create", async () => {
    // @ts-expect-error: expected, because the create method shouldn't exist
    expect(testService.create).toBeUndefined();
  });

  test("entityType: delete", async () => {
    const request = testService.delete();
    const result = request.getInfoConverted();

    expect(result).toStrictEqual(request.getInfo());
    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.method).toBe("DELETE");
    expect(result.data).toBeUndefined();
    expect(odataClient.lastRequestConfig).toBeUndefined();
    expect(result.headers).toBeUndefined();

    expectTypeOf(await request.execute()).toEqualTypeOf<HttpResponseModel<undefined>>();
  });

  test("entityType: no url encoding", async () => {
    const toTest = new serviceConstructor(odataClient, BASE_URL, NAME, { noUrlEncoding: true });

    const request = toTest.query((qb) => qb.select("userName")).getInfo();

    expect(request.url).toBe(EXPECTED_PATH + "?$select=UserName");
  });
}
