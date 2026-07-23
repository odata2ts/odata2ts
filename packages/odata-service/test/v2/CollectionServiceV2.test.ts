import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2 } from "@odata2ts/odata-core";
import {
  EnumCollection,
  QNumericEnumCollection,
  QStringV2Collection,
  StringCollection,
} from "@odata2ts/odata-query-objects";
import { describe, expect, expectTypeOf, test } from "vitest";
import { CollectionServiceV2, DEFAULT_HEADERS, ODataServiceOptions } from "../../src";
import { commonCollectionTests, getParams } from "../CollectionServiceTests";
import { MockClient } from "../mock/MockClient";

export enum NumericTestEnum {
  A,
  B,
  ZEBRA = 99,
}

type RESPONSE_TYPE_DEFAULT = HttpResponseModel<undefined>;
type RESPONSE_TYPE_ENUM = HttpResponseModel<ODataCollectionResponseV2<NumericTestEnum>>;
type RESPONSE_TYPE_STRING = HttpResponseModel<ODataCollectionResponseV2<string>>;

describe("CollectionService V2 Tests", () => {
  const odataClient = new MockClient(true);
  const BASE_PATH = "";
  const NAME_STRING = "testString";
  const NAME_ENUM = "testEnum";

  const stringConstructor = (
    basePath: string,
    name: string,
    options?: ODataServiceOptions,
  ): CollectionServiceV2<MockClient, StringCollection, QStringV2Collection> => {
    return new CollectionServiceV2(odataClient, basePath, name, new QStringV2Collection(), options);
  };
  const enumConstructor = (
    basePath: string,
    name: string,
  ): CollectionServiceV2<
    MockClient,
    EnumCollection<NumericTestEnum>,
    QNumericEnumCollection<typeof NumericTestEnum>
  > => {
    return new CollectionServiceV2(odataClient, basePath, name, new QNumericEnumCollection(NumericTestEnum));
  };

  commonCollectionTests(stringConstructor, enumConstructor);

  test("numeric enum collection: add", async () => {
    const enumService = enumConstructor(BASE_PATH, NAME_ENUM);

    const cmd = enumService.add(NumericTestEnum.A);
    const result = cmd.getInfoConverted();

    expect(result.url).toBe(NAME_ENUM);
    expect(result.method).toBe("POST");
    expect(result.headers).toStrictEqual(DEFAULT_HEADERS);
    expect(result.data).toEqual(NumericTestEnum[NumericTestEnum.A]);
    // without conversion
    expect(cmd.getInfo().data).toEqual(NumericTestEnum.A);

    expectTypeOf(await enumService.add(NumericTestEnum.A).execute()).toEqualTypeOf<RESPONSE_TYPE_DEFAULT>();
    expectTypeOf(await enumService.add<false>(NumericTestEnum.A).execute()).toEqualTypeOf<RESPONSE_TYPE_DEFAULT>();

    // check response conversion
    odataClient.setCollectionResponse([0]);
    const response = await enumService.add<true>(NumericTestEnum.A).execute();
    expect(response.data).toStrictEqual({ d: { results: [NumericTestEnum.A] } });

    expectTypeOf(response).toEqualTypeOf<RESPONSE_TYPE_ENUM>();
  });

  test("numeric enum collection: add with select/expand", async () => {
    const enumService = enumConstructor(BASE_PATH, NAME_ENUM);
    const params = getParams({ $select: "*" });

    const cmd = enumService.add(NumericTestEnum.A, (b) => b.select("*"));
    const result = cmd.getInfo();

    expect(result.url).toBe(NAME_ENUM + params);
    expect(result.method).toBe("POST");
  });

  test("collection: update with select/expand and addToQuery", async () => {
    const stringService = stringConstructor(BASE_PATH, NAME_STRING);
    const model = ["test1", "t2"];
    const params = getParams({ $select: "*" });

    const request = stringService.update(model).addToQuery((b) => b.select("*"));

    expect(request.getInfo().url).toBe(NAME_STRING + params);
    expect(request.getInfo().method).toBe("PUT");
    expect(request.getInfo().data).toEqual(model);
  });

  test("collection: update", async () => {
    const stringService = stringConstructor(BASE_PATH, NAME_STRING);
    const model = ["test1", "t2"];
    const request = stringService.update(model);
    const result = request.getInfo();

    expect(result.url).toBe(NAME_STRING);
    expect(result.method).toBe("PUT");
    expect(result.data).toEqual(model);
    expect(result.headers).toStrictEqual(DEFAULT_HEADERS);

    expectTypeOf(await stringService.update(model).execute()).toEqualTypeOf<RESPONSE_TYPE_DEFAULT>();
    expectTypeOf(await stringService.update<false>(model).execute()).toEqualTypeOf<RESPONSE_TYPE_DEFAULT>();

    // check response conversion
    odataClient.setCollectionResponse(model);
    const response = await stringService.update<true>(model).execute();
    expect(response.data).toStrictEqual({ d: { results: model } });

    expectTypeOf(response).toEqualTypeOf<RESPONSE_TYPE_STRING>();
  });

  test("numeric enum collection: filter", async () => {
    const params = getParams({ $filter: "$it eq 'A' or $it eq 'B'" });

    const enumService = enumConstructor(BASE_PATH, NAME_ENUM);

    const request = enumService
      .query((queryBuilder, qObj) => queryBuilder.filter(qObj.it.eq(NumericTestEnum.A).or(qObj.it.eq(1))))
      .getInfo();
    expect(request.url).toBe(NAME_ENUM + params);
  });

  test("collection: count", async () => {
    const stringService = stringConstructor(BASE_PATH, NAME_STRING);
    const params = getParams({ $inlinecount: "allpages" });
    const expected = "testString" + params;

    const request = stringService.query((builder) => builder.count()).getInfo();

    expect(request.url).toBe(expected);
  });
});
