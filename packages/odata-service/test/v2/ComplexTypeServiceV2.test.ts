import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataComplexModelResponseV2 } from "@odata2ts/odata-core";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { DEFAULT_HEADERS, MERGE_HEADERS } from "../../src";
import { EditablePersonModel, Feature, PersonModel } from "../fixture/PersonModel";
import { FakedComplexServiceV2 } from "../fixture/v2/FakedComplexServiceV2";
import { MockClient } from "../mock/MockClient";

describe("ComplexTypeService V2 Test", () => {
  const odataClient = new MockClient(true);
  const BASE_URL = "path";
  const NAME = "test('tester')";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;

  let testService: FakedComplexServiceV2<MockClient>;

  beforeEach(() => {
    testService = new FakedComplexServiceV2(odataClient, BASE_URL, NAME);
  });

  test("complexType: getPath", () => {
    expect(testService.getPath()).toBe(EXPECTED_PATH);
  });

  test("complexType: delete", async () => {
    const request = testService.delete();
    const result = request.getInfo();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.method).toBe("DELETE");
    expect(result.data).toBeUndefined();

    expectTypeOf(await request.execute()).toEqualTypeOf<HttpResponseModel<undefined>>();
  });

  test("complexType: query", async () => {
    const request = testService.query();
    const result = request.getInfo();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.method).toBe("GET");
    expect(result.data).toBeUndefined();

    expectTypeOf(await request.execute()).toEqualTypeOf<
      HttpResponseModel<ODataComplexModelResponseV2<PersonModel>>
    >();
  });

  test("complexType: query with select", async () => {
    const unencodedService = new FakedComplexServiceV2(odataClient, BASE_URL, NAME, { noUrlEncoding: true });

    const request = unencodedService.query((b) => b.select("age"));

    expect(request.getInfo().url).toBe(EXPECTED_PATH + "?$select=Age");
    expect(request.getInfo().method).toBe("GET");
  });

  test("complexType: patch = merge", async () => {
    const model: Partial<PersonModel> = { age: "45" };
    const odataModel = { Age: 45 };

    const request = testService.patch(model);
    const result = request.getInfo();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.method).toBe("POST");
    expect(result.data).toStrictEqual(model);
    expect(request.getInfoConverted().data).toStrictEqual(odataModel);
    expect(result.headers).toStrictEqual({ ...DEFAULT_HEADERS, ...MERGE_HEADERS });

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

    expectTypeOf(await request.execute()).toEqualTypeOf<HttpResponseModel<undefined>>();
  });

  test("complexType: patch with select/expand", async () => {
    const unencodedService = new FakedComplexServiceV2(odataClient, BASE_URL, NAME, { noUrlEncoding: true });
    const model: Partial<PersonModel> = { age: "45" };

    const request = unencodedService.patch(model, (b) => b.select("age"));

    expect(request.getInfo().url).toBe(EXPECTED_PATH + "?$select=Age");
    expect(request.getInfo().method).toBe("POST");
  });

  test("complexType: update returns a builder-backed Cmd, addToQuery works", async () => {
    const unencodedService = new FakedComplexServiceV2(odataClient, BASE_URL, NAME, { noUrlEncoding: true });
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
});
