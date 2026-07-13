import { EnumCollection, QEnumCollection, QStringCollection, StringCollection } from "@odata2ts/odata-query-objects";
import { describe, expect, test } from "vitest";
import { CollectionServiceV4, DEFAULT_HEADERS, ODataServiceOptions } from "../../src";
import { commonCollectionTests, getParams } from "../CollectionServiceTests";
import { MockClient } from "../mock/MockClient";

export enum StringTestEnum {
  A = "A",
  B = "B",
  ZEBRA = "ZEBRA",
}

describe("CollectionService V4 Tests", () => {
  const odataClient = new MockClient(false);
  const BASE_PATH = "";
  const NAME_STRING = "testString";
  const NAME_ENUM = "testEnum";

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

  commonCollectionTests(odataClient, stringConstructor, enumConstructor);

  test("string enum collection: add", async () => {
    const enumService = enumConstructor(BASE_PATH, NAME_ENUM);

    const cmd = enumService.add(StringTestEnum.A);
    const request = cmd.getInfo();

    expect(request.url).toBe(NAME_ENUM);
    expect(request.method).toBe("POST");
    expect(request.headers).toStrictEqual(DEFAULT_HEADERS);
    expect(request.data).toEqual(StringTestEnum.A);
    expect(cmd.getInfoConverted().data).toEqual(StringTestEnum.A);
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
    const testService = new CollectionServiceV4(odataClient, BASE_PATH, NAME_STRING, new QStringCollection(), {
      bigNumbersAsString: true,
    });

    const request = testService.query().getInfo();

    expect(request.headers).toStrictEqual({
      Accept: "application/json;IEEE754Compatible=true",
      "Content-Type": "application/json;IEEE754Compatible=true",
    });
  });

  test("collection: count", async () => {
    const stringService = stringConstructor(BASE_PATH, NAME_STRING);
    const params = getParams({ $count: "true" });
    const expected = "testString" + params;

    const request = stringService.query((builder) => builder.count()).getInfo();

    expect(request.url).toBe(expected);
  });
});
