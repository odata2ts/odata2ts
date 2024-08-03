import { BigNumber } from "bignumber.js";
import { DateTime, Duration } from "luxon";

import { EditableOneOfEverythingModel as EditableOneOfEverythingModelV2 } from "../../build/converter-v2/DataTypeExampleModel";
import { DataTypeExampleService as DataTypeExampleServiceV2 } from "../../build/converter-v2/DataTypeExampleService";
import { EditableOneOfEverythingModel as EditableOneOfEverythingModelV4 } from "../../build/converter-v4/DataTypeExampleModel";
import { DataTypeExampleService as DataTypeExampleServiceV4 } from "../../build/converter-v4/DataTypeExampleService";
import { MockODataClient } from "../MockODataClient";

const BASE_URL = "EXP";
const DATA_TYPE_SERVICE_V4 = new DataTypeExampleServiceV4(new MockODataClient(), BASE_URL);
const DATA_TYPE_SERVICE_V2 = new DataTypeExampleServiceV2(new MockODataClient(), BASE_URL);

describe("DataType & Converter Tests", function () {
  test("v4: sanity check", async () => {
    const expected = `${BASE_URL}/OneOfEverything`;

    const toTest = DATA_TYPE_SERVICE_V4.oneOfEverything();

    expect(toTest.getPath()).toBe(expected);
    expect(toTest.getKeySpec().length).toBe(1);
    expect(toTest.getKeySpec()[0].getName()).toEqual("GuidType");
  });

  test("v4: editable model is correctly typed", async () => {
    const subject: EditableOneOfEverythingModelV4 = {
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
      dateType: DateTime.now(),
      timeOfDayType: DateTime.now(),
      dateTimeOffsetType: new Date(),
      durationType: { years: 1 },
    };

    await DATA_TYPE_SERVICE_V4.oneOfEverything().create(subject);
    await DATA_TYPE_SERVICE_V4.oneOfEverything("abc").update(subject);
    await DATA_TYPE_SERVICE_V4.oneOfEverything("abc").patch(subject);
  });

  test("v2: sanity check", async () => {
    const expected = `${BASE_URL}/OneOfEverything`;

    const toTest = DATA_TYPE_SERVICE_V2.oneOfEverything();

    expect(toTest.getPath()).toBe(expected);
    expect(toTest.getKeySpec().length).toBe(1);
    expect(toTest.getKeySpec()[0].getName()).toEqual("StringType");
  });

  test("v2: editable model is correctly typed", async () => {
    const subject: EditableOneOfEverythingModelV2 = {
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
      timeType: Duration.fromISO("T1H2M3S"),
      dateTimeOffsetType: DateTime.now(),
    };

    await DATA_TYPE_SERVICE_V2.oneOfEverything().create(subject);
    await DATA_TYPE_SERVICE_V2.oneOfEverything("abc").update(subject);
    await DATA_TYPE_SERVICE_V2.oneOfEverything("abc").patch(subject);
  });
});
