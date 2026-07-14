import { BigNumber } from "bignumber.js";
import { describe, expect, test } from "vitest";
import { EditableOneOfEverything } from "../../src-generated/data-types-v2/DataTypeExampleModel";
import { DataTypeExampleService } from "../../src-generated/data-types-v2/DataTypeExampleService";
import { MockODataClient } from "../MockODataClient";

describe("V2 Data Types & Converter Tests", function () {
  const BASE_URL = "EXP";
  const ONE_OF_EVERYTHING_URL = `${BASE_URL}/OneOfEverything`;
  const ODATA_CLIENT = new MockODataClient();
  const DATA_TYPE_SERVICE = new DataTypeExampleService(ODATA_CLIENT, BASE_URL, { noUrlEncoding: true });

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
      byteType: "1",
      sByteType: "-1",
      int16Type: 16,
      int32Type: 32,
      int64Type: "123",
      singleType: "1.1",
      doubleType: "2.2",
      decimalType: "9.9",
      timeType: "PT12H59S59S",
      dateTimeType: "2006-11-05T00:00:00.000Z",
      dateTimeOffsetType: "2022-12-31T12:59:59Z",
    };

    const expectedResult = {
      StringType: subject.stringType,
      BooleanType: subject.booleanType,
      ByteType: subject.byteType,
      SByteType: subject.sByteType,
      Int16Type: subject.int16Type,
      Int32Type: subject.int32Type,
      Int64Type: subject.int64Type,
      SingleType: subject.singleType,
      DoubleType: subject.doubleType,
      DecimalType: subject.decimalType,
      TimeType: subject.timeType,
      DateTimeType: subject.dateTimeType,
      DateTimeOffsetType: subject.dateTimeOffsetType,
    };

    await DATA_TYPE_SERVICE.oneOfEverything().create(subject).execute();
    expect(ODATA_CLIENT.lastData).toStrictEqual(expectedResult);
    await DATA_TYPE_SERVICE.oneOfEverything("abc").update(subject).execute();
    expect(ODATA_CLIENT.lastData).toStrictEqual(expectedResult);
    await DATA_TYPE_SERVICE.oneOfEverything("abc").patch(subject).execute();
    expect(ODATA_CLIENT.lastData).toStrictEqual(expectedResult);
  });

  test("v2: DateTime in URL", async () => {
    const expected = "2006-11-05T00:00:00.000Z";

    await DATA_TYPE_SERVICE.oneOfEverything()
      .query((builder, qOoe) => {
        return builder.filter(qOoe.dateTimeType.eq(expected));
      })
      .execute();

    expect(ODATA_CLIENT.lastUrl).toBe(`${ONE_OF_EVERYTHING_URL}?$filter=DateTimeType eq datetime'${expected}'`);
  });
});
