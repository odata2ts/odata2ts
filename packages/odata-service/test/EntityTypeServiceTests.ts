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

  test("entityType: query with qObject", async () => {
    const expected = `${EXPECTED_PATH}?${encodeURIComponent("$filter")}=${encodeURIComponent("Age gt 18")}`;

    const request = testService.query((queryBuilder, qObj) => queryBuilder.filter(qObj.age.gt("18"))).getInfo();

    expect(request.url).toBe(expected);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("GET");
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

    const request = toTest.query((qb, q) => qb.filter(q.userName.eq("2"))).getInfo();

    expect(request.url).toBe(EXPECTED_PATH + "?$filter=UserName eq '2'");
  });
}
