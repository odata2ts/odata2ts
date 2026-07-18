import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4 } from "@odata2ts/odata-core";
import {
  BooleanCollection,
  EnumCollection,
  QBooleanCollection,
  QEnumCollection,
  QStringCollection,
  StringCollection,
} from "@odata2ts/odata-query-objects";
import { booleanToNumberConverter } from "@odata2ts/test-converters";
import { describe, expect, expectTypeOf, test } from "vitest";
import { CollectionServiceV4, DEFAULT_HEADERS, ODataServiceOptions, RequestInfo } from "../../src";
import { commonCollectionTests, getParams } from "../CollectionServiceTests";
import { MockClient } from "../mock/MockClient";

export enum StringTestEnum {
  A = "A",
  B = "B",
  ZEBRA = "ZEBRA",
}

type RESPONSE_TYPE_DEFAULT = HttpResponseModel<undefined>;
type RESPONSE_TYPE_ENUM = HttpResponseModel<ODataCollectionResponseV4<StringTestEnum>>;

describe("CollectionService V4 Tests", () => {
  const odataClient = new MockClient(false);
  const BASE_PATH = "";
  const NAME_STRING = "testString";
  const NAME_ENUM = "testEnum";

  const serviceConv = new CollectionServiceV4<MockClient, BooleanCollection, QBooleanCollection<number>, number>(
    odataClient,
    BASE_PATH,
    NAME_STRING,
    new QBooleanCollection(undefined, booleanToNumberConverter),
  );

  const stringConstructor = (
    basePath: string,
    name: string,
    options?: ODataServiceOptions,
  ): CollectionServiceV4<MockClient, StringCollection, QStringCollection> => {
    return new CollectionServiceV4(odataClient, basePath, name, new QStringCollection(), options);
  };
  const enumConstructor = (
    basePath: string,
    name: string,
  ): CollectionServiceV4<MockClient, EnumCollection<StringTestEnum>, QEnumCollection<typeof StringTestEnum>> => {
    return new CollectionServiceV4(odataClient, basePath, name, new QEnumCollection(StringTestEnum));
  };

  commonCollectionTests(stringConstructor, enumConstructor);

  test("string enum collection: add", async () => {
    const enumService = enumConstructor(BASE_PATH, NAME_ENUM);

    const cmd = enumService.add(StringTestEnum.A);
    const request = cmd.getInfo();

    expect(request.url).toBe(NAME_ENUM);
    expect(request.method).toBe("POST");
    expect(request.headers).toStrictEqual(DEFAULT_HEADERS);
    expect(request.data).toEqual(StringTestEnum.A);
    expect(cmd.getInfoConverted().data).toEqual(StringTestEnum.A);

    expectTypeOf(await enumService.add(StringTestEnum.A).execute()).toEqualTypeOf<RESPONSE_TYPE_DEFAULT>();
    expectTypeOf(await enumService.add<false>(StringTestEnum.A).execute()).toEqualTypeOf<RESPONSE_TYPE_DEFAULT>();

    expectTypeOf(await enumService.add<true>(StringTestEnum.A).execute()).toEqualTypeOf<
      HttpResponseModel<ODataCollectionResponseV4<StringTestEnum>>
    >();

    // check response conversion
    odataClient.setCollectionResponse(["A"]);
    const response = await enumService.add<true>(StringTestEnum.A).execute();
    expect(response.data).toStrictEqual({ value: [StringTestEnum.A] });

    expectTypeOf(response).toEqualTypeOf<RESPONSE_TYPE_ENUM>();
  });

  test("collection: add with converter", async () => {
    const request = serviceConv.add<true>(1);
    const result = request.getInfoConverted();

    expect(result.data).toBe(true);
    expectTypeOf(request.getInfo()).toEqualTypeOf<RequestInfo<number>>();

    odataClient.setValueResponse([false]);
    const response = await request.execute();

    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<number>>>();
    expect(response.data).toStrictEqual({ value: [0] });
  });

  test("collection: update", async () => {
    const service = serviceConv;
    const odataModel = [true, false];
    const userModel = [1, 0];
    const request = service.update(userModel);
    const result = request.getInfo();

    expect(result.url).toBe(NAME_STRING);
    expect(result.method).toBe("PUT");
    expect(result.headers).toStrictEqual(DEFAULT_HEADERS);
    expect(result.data).toEqual(userModel);
    expect(request.getInfoConverted().data).toStrictEqual(odataModel);

    expectTypeOf(await service.update(userModel).execute()).toEqualTypeOf<RESPONSE_TYPE_DEFAULT>();
    expectTypeOf(await service.update<false>(userModel).execute()).toEqualTypeOf<RESPONSE_TYPE_DEFAULT>();

    // check response conversion
    odataClient.setCollectionResponse(odataModel);
    const response = await service.update<true>(userModel).execute();
    expect(response.data).toStrictEqual({ value: userModel });

    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<number>>>();
  });

  test("string enum collection: filter", async () => {
    const params = getParams({ $filter: "$it eq 'A' or $it eq 'B'" });

    const enumService = enumConstructor(BASE_PATH, NAME_ENUM);

    const request = enumService
      .query((queryBuilder, qObj) => queryBuilder.filter(qObj.it.eq(StringTestEnum.A).or(qObj.it.eq("B"))))
      .getInfo();
    expect(request.url).toBe(NAME_ENUM + params);
  });

  test("collection: big number", async () => {
    const testService = new CollectionServiceV4<MockClient, StringCollection, QStringCollection>(
      odataClient,
      BASE_PATH,
      NAME_STRING,
      new QStringCollection(),
      {
        bigNumbersAsString: true,
      },
    );

    const request = testService.query();

    expect(request.getInfo().headers).toStrictEqual({
      Accept: "application/json;IEEE754Compatible=true",
      "Content-Type": "application/json;IEEE754Compatible=true",
    });

    expectTypeOf(await request.execute()).toEqualTypeOf<
      HttpResponseModel<ODataCollectionResponseV4<StringCollection>>
    >();
  });

  test("collection: count", async () => {
    const stringService = stringConstructor(BASE_PATH, NAME_STRING);
    const params = getParams({ $count: "true" });
    const expected = "testString" + params;

    const request = stringService.query((builder) => builder.count()).getInfo();

    expect(request.url).toBe(expected);
  });
});
