import { HttpResponseModel } from "@odata2ts/http-client-api";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { DEFAULT_HEADERS, MERGE_HEADERS, RequestInfo } from "../../src";
import { commonEntityTypeServiceTests } from "../EntityTypeServiceTests";
import { EditablePersonModel, Feature, PersonModel } from "../fixture/PersonModel";
import { PersonModelV2Service } from "../fixture/v2/PersonModelV2Service";
import { MockClient } from "../mock/MockClient";

describe("EntityTypeService V2 Test", () => {
  const odataClient = new MockClient(true);
  const BASE_URL = "path";
  const NAME = "test('tester')";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;

  let testService: PersonModelV2Service<MockClient>;

  commonEntityTypeServiceTests(odataClient, PersonModelV2Service);

  beforeEach(() => {
    testService = new PersonModelV2Service(odataClient, BASE_URL, NAME);
  });

  test("entityType: patch = merge", async () => {
    const model: Partial<PersonModel> = { age: "45" };
    const odataModel = { Age: 45 };

    const request = testService.patch(model);
    const result = request.getInfo();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.method).toBe("POST");
    expect(result.data).toStrictEqual(model);
    expect(result.headers).toStrictEqual({ ...DEFAULT_HEADERS, ...MERGE_HEADERS });
    expect(request.getInfoConverted().data).toStrictEqual(odataModel);
    expectTypeOf(result).toEqualTypeOf<RequestInfo<Partial<EditablePersonModel>>>();

    expectTypeOf(await request.execute()).toEqualTypeOf<HttpResponseModel<undefined>>();
  });

  test("entityType: update", async () => {
    const model: EditablePersonModel = {
      userName: "tester",
      age: "14",
      favFeature: Feature.Feature1,
      features: [Feature.Feature1],
    };
    const odataModel = {
      UserName: "tester",
      Age: 14,
      FavFeature: "Feature1",
      Features: ["Feature1"],
    };

    const request = testService.update(model);
    const result = request.getInfo();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.method).toBe("PUT");
    expect(result.headers).toStrictEqual(DEFAULT_HEADERS);
    expect(result.data).toEqual(model);
    expect(request.getInfoConverted().data).toEqual(odataModel);
    expectTypeOf(result).toEqualTypeOf<RequestInfo<EditablePersonModel>>();

    expectTypeOf(await request.execute()).toEqualTypeOf<HttpResponseModel<undefined>>();
  });

  test("entityType: patch with select/expand", async () => {
    const unencodedService = new PersonModelV2Service(odataClient, BASE_URL, NAME, { noUrlEncoding: true });
    const model: Partial<PersonModel> = { age: "45" };

    const request = unencodedService.patch(model, (b) => b.select("age"));

    expect(request.getInfo().url).toBe(EXPECTED_PATH + "?$select=Age");
    expect(request.getInfo().method).toBe("POST");
    expect(request.getInfo().headers).toStrictEqual({ ...DEFAULT_HEADERS, ...MERGE_HEADERS });
  });

  test("entityType: update with select/expand", async () => {
    const unencodedService = new PersonModelV2Service(odataClient, BASE_URL, NAME, { noUrlEncoding: true });
    const model: EditablePersonModel = {
      userName: "tester",
      age: "14",
      favFeature: Feature.Feature1,
      features: [Feature.Feature1],
    };

    const request = unencodedService.update(model, (b) => b.expanding("bestFriend", (nested) => nested.select("age")));

    expect(request.getInfo().url).toBe(EXPECTED_PATH + "?$select=BestFriend/Age&$expand=BestFriend");
    expect(request.getInfo().method).toBe("PUT");
  });

  test("entityType: update returns a builder-backed Cmd, addToQuery works", async () => {
    const unencodedService = new PersonModelV2Service(odataClient, BASE_URL, NAME, { noUrlEncoding: true });
    const model: EditablePersonModel = {
      userName: "tester",
      age: "14",
      favFeature: Feature.Feature1,
      features: [Feature.Feature1],
    };

    const request = unencodedService.update(model).addToQuery((b) => b.select("age"));

    expect(request.getInfo().url).toBe(EXPECTED_PATH + "?$select=Age");
    expect(request.getInfo().method).toBe("PUT");
    expect(request.getInfo().data).toEqual(model);
  });

  test("entityType: update query builder only allows select/expand/expanding", () => {
    testService.update({} as EditablePersonModel, (b, q) => {
      // @ts-expect-error: filter is not available for a single-model write response builder
      b.filter(q.age.gt("1"));
      // @ts-expect-error: top is not available for a single-model write response builder
      b.top(1);
    });
  });

  test("entityType V2: function params", async () => {
    const expected =
      EXPECTED_PATH +
      "/GET_SOMETHING?TEST_GUID=guid'123'&testDateTime=datetime'1'&testDateTimeO=datetimeoffset'2'&testTime=time'3'";

    const request = testService
      .getSomething({
        testGuid: { prefix: "xxx", value: "123" },
        testDateTime: "1",
        testDateTimeO: "2",
        testTime: "3",
      })
      .getInfo();

    expect(request.url).toBe(expected);
    expect(request.data).toBeUndefined();
    expect(request.method).toBe("GET");
  });
});
