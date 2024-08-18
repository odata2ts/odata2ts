import { BigNumber } from "bignumber.js";
import { DateTime } from "luxon";
import { describe, expect, test } from "vitest";
import type { EditableOneOfEverything } from "../../build/data-types-v4/DataTypeExampleModel";
import { DataTypeExampleService } from "../../build/data-types-v4/DataTypeExampleService";
import { MockODataClient } from "../MockODataClient";

describe("V4 Data Types & Converter Tests", function () {
  const BASE_URL = "EXP";
  const ODATA_CLIENT = new MockODataClient();
  const DATA_TYPE_SERVICE = new DataTypeExampleService(ODATA_CLIENT, BASE_URL);

  test("sanity check", async () => {
    const expected = `${BASE_URL}/OneOfEverything`;

    const toTest = DATA_TYPE_SERVICE.oneOfEverything();

    expect(toTest.getPath()).toBe(expected);
    expect(toTest.getKeySpec().length).toBe(1);
    expect(toTest.getKeySpec()[0].getName()).toEqual("GuidType");
  });

  test("editable model is correctly typed", async () => {
    const subject: EditableOneOfEverything = {
      guidType: "abc",
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
      dateType: DateTime.fromISO("2022-12-31T00:00:00"),
      timeOfDayType: DateTime.fromISO("2000-01-15T12:59:59"),
      dateTimeOffsetType: new Date("2022-12-31T12:59:59Z"),
      durationType: { years: 1 },
    };

    const expectedResult = {
      GuidType: "abc",
      StringType: "Tester",
      BooleanType: true,
      ByteType: 1,
      SByteType: -1,
      Int16Type: 16,
      Int32Type: 32,
      Int64Type: "123",
      SingleType: 1.1,
      DoubleType: 2.2,
      DecimalType: "9.9",
      DateType: "2022-12-31",
      TimeOfDayType: "12:59:59",
      DateTimeOffsetType: "2022-12-31T12:59:59.000Z",
      DurationType: "P1Y",
    };

    await DATA_TYPE_SERVICE.oneOfEverything().create(subject);
    expect(ODATA_CLIENT.lastData).toStrictEqual(expectedResult);

    await DATA_TYPE_SERVICE.oneOfEverything("abc").update(subject);
    expect(ODATA_CLIENT.lastData).toStrictEqual(expectedResult);

    await DATA_TYPE_SERVICE.oneOfEverything("abc").patch(subject);
    expect(ODATA_CLIENT.lastData).toStrictEqual(expectedResult);
  });
});
