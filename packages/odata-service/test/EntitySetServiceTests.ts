import { beforeEach, expect, test } from "vitest";
import { DEFAULT_HEADERS, EntitySetServiceV2, EntitySetServiceV4, ODataServiceOptions } from "../src";
import { EditablePersonModel, PersonId, PersonModel } from "./fixture/PersonModel";
import { QPersonV2 } from "./fixture/v2/QPersonV2";
import { QPersonV4 } from "./fixture/v4/QPersonV4";
import { MockClient } from "./mock/MockClient";

export function commonEntitySetTests(
  odataClient: MockClient,
  serviceConstructor: new (
    odataClient: MockClient,
    baseUrl: string,
    name: string,
    options?: ODataServiceOptions,
  ) =>
    | EntitySetServiceV4<MockClient, PersonModel, EditablePersonModel, QPersonV4, PersonId>
    | EntitySetServiceV2<MockClient, PersonModel, EditablePersonModel, QPersonV2, PersonId>,
) {
  const BASE_URL = "/base";
  const NAME = "EntityXY";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;

  let testService:
    | EntitySetServiceV4<MockClient, PersonModel, EditablePersonModel, QPersonV4, PersonId>
    | EntitySetServiceV2<MockClient, PersonModel, EditablePersonModel, QPersonV2, PersonId>;

  beforeEach(() => {
    testService = new serviceConstructor(odataClient, BASE_URL, NAME);
  });

  test("entitySet: path & key spec", async () => {
    expect(testService.getPath()).toBe(EXPECTED_PATH);
    expect(testService.getKeySpec().length).toBe(1);
    expect(testService.getKeySpec()[0].getName()).toBe("UserName");
    expect(testService.getKeySpec()[0].getMappedName()).toBe("userName");
  });

  test("entitySet: createKey", async () => {
    expect(testService.createKey("xxx")).toBe(`${NAME}('xxx')`);
    expect(testService.createKey({ userName: "xxx" })).toBe(`${NAME}(UserName='xxx')`);
  });

  test("entitySet: createKey without encoding", async () => {
    expect(testService.createKey("&/?", true)).toBe(`${NAME}('&/?')`);
    expect(testService.createKey({ userName: "&/?" }, true)).toBe(`${NAME}(UserName='&/?')`);
  });

  test("entitySet: parseKey", async () => {
    expect(testService.parseKey(`${NAME}('xxx')`)).toBe("xxx");
    expect(testService.parseKey(`${NAME}(UserName='xxx')`)).toStrictEqual({ userName: "xxx" });
  });

  test("entitySet: parseKey not decoding", async () => {
    expect(testService.parseKey(`${NAME}('&/?')`, true)).toBe("&/?");
    expect(testService.parseKey(`${NAME}(UserName='&/?')`, true)).toStrictEqual({ userName: "&/?" });
  });

  test("entitySet: query", async () => {
    const expected = `${EXPECTED_PATH}`;

    const cmd = testService.query();
    const request = cmd.getInfo();

    expect(request.url).toBe(expected);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("GET");
    expect(request.headers).toStrictEqual(DEFAULT_HEADERS);
  });

  test("entitySet: query with select", async () => {
    const expected = `${EXPECTED_PATH}?${encodeURIComponent("$select")}=${encodeURIComponent("UserName,Age")}`;

    const request = testService.query((queryBuilder) => queryBuilder.select("userName", "age")).getInfo();

    expect(request.url).toBe(expected);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("GET");
  });

  test("entitySet: query with qObject", async () => {
    const expected = `${EXPECTED_PATH}?${encodeURIComponent("$filter")}=${encodeURIComponent("Age gt 18")}`;

    const request = testService.query((queryBuilder, qObj) => queryBuilder.filter(qObj.age.gt("18"))).getInfo();

    expect(request.url).toBe(expected);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("GET");
  });

  test("entitySet: no url encoding", async () => {
    const toTest = new serviceConstructor(odataClient, BASE_URL, NAME, { noUrlEncoding: true });

    const request = toTest.query((qb, q) => qb.filter(q.userName.eq("2"))).getInfo();

    expect(request.url).toBe(EXPECTED_PATH + "?$filter=UserName eq '2'");
  });
}
