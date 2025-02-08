import { BigNumber } from "bignumber.js";
import { describe, expect, test } from "vitest";
import { EditableOneOfEverything } from "../../build/data-types-v2/DataTypeExampleModel";
import { DataTypeExampleService } from "../../build/data-types-v2/DataTypeExampleService";
import { MockODataClient } from "../MockODataClient";

describe("V2 Data Types & Converter Tests", function () {
  const BASE_URL = "EXP";
  const ONE_OF_EVERYTHING_URL = `${BASE_URL}/OneOfEverything`;
  const ODATA_CLIENT = new MockODataClient();
  const DATA_TYPE_SERVICE = new DataTypeExampleService(ODATA_CLIENT, BASE_URL);
  const ENC = encodeURIComponent;

  test("sanity check", async () => {
    const toTest = DATA_TYPE_SERVICE.oneOfEverything();

    expect(toTest.getPath()).toBe(ONE_OF_EVERYTHING_URL);
    expect(toTest.getKeySpec().length).toBe(1);
    expect(toTest.getKeySpec()[0].getName()).toEqual("StringType");
  });

  test("v2: editable model is correctly typed", async () => {
    const subject: EditableOneOfEverything = {
      stringType: "Tester",
      booleanType: true,
      byteType: 1,
      sByteType: -1,
      int16Type: 16,
      int32Type: 32,
      int64Type: BigInt("123"),
      singleType: 1.1,
      doubleType: 2.2,
      decimalType: BigNumber("9.9"),
      // timeType: DateTime.fromISO("12:59:59"),
      dateTimeType: "2006-11-05T00:00:00.000Z",
      dateTimeOffsetType: "2022-12-31T12:59:59Z",
    };

    const expectedResult = {
      StringType: "Tester",
      BooleanType: true,
      ByteType: "1",
      SByteType: "-1",
      Int16Type: 16,
      Int32Type: 32,
      Int64Type: "123",
      SingleType: "1.1",
      DoubleType: "2.2",
      DecimalType: "9.9",
      // TODO: Edm.Time gives undefined
      // TimeType: "PT1H2M3S",
      DateTimeType: "/Date(1162684800000)/",
      DateTimeOffsetType: "2022-12-31T12:59:59Z",
    };

    await DATA_TYPE_SERVICE.oneOfEverything().create(subject);
    expect(ODATA_CLIENT.lastData).toStrictEqual(expectedResult);
    await DATA_TYPE_SERVICE.oneOfEverything("abc").update(subject);
    expect(ODATA_CLIENT.lastData).toStrictEqual(expectedResult);
    await DATA_TYPE_SERVICE.oneOfEverything("abc").patch(subject);
    expect(ODATA_CLIENT.lastData).toStrictEqual(expectedResult);
  });

  test("v2: DateTime in URL", async () => {
    const expected = "2006-11-05T00:00:00.000Z";

    await DATA_TYPE_SERVICE.oneOfEverything().query((builder, qOoe) => {
      return builder.filter(qOoe.dateTimeType.eq(expected));
    });

    expect(ODATA_CLIENT.lastUrl).toBe(
      `${ONE_OF_EVERYTHING_URL}?${ENC("$filter")}=${ENC(`DateTimeType eq datetime'${expected}'`)}`,
    );
  });
});
