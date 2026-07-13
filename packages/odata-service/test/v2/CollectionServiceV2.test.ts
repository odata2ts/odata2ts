import {
  EnumCollection,
  QNumericEnumCollection,
  QStringV2Collection,
  StringCollection,
} from "@odata2ts/odata-query-objects";
import { describe, expect, test } from "vitest";
import { CollectionServiceV2, DEFAULT_HEADERS, ODataServiceOptions } from "../../src";
import { commonCollectionTests, getParams } from "../CollectionServiceTests";
import { MockClient } from "../mock/MockClient";

export enum NumericTestEnum {
  A,
  B,
  ZEBRA = 99,
}

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

  commonCollectionTests(odataClient, stringConstructor, enumConstructor);

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
