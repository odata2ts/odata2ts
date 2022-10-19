import { ODataTypesV2, ODataTypesV4 } from "@odata2ts/odata-core";

import { dateTimeToDateTimeOffsetConverter } from "../src";

describe("V2DateTimeToDateTimeOffset Test", () => {
  const TIMESTAMP = 1672531199000;
  const FROM_STRING = `/Date(${TIMESTAMP})/`;
  const TO_STRING = "2022-12-31T23:59:59.000Z";
  const TO_TEST = dateTimeToDateTimeOffsetConverter;

  const createWithOffset = (offset: number, negative = false) => `/Date(${TIMESTAMP}${negative ? "-" : "+"}${offset})/`;
  const createIsoWithOffset = (offset: string) => `2022-12-31T23:59:59.000${offset}`;

  test("base attributes", () => {
    expect(TO_TEST.id).toBe("dateTimeToDateTimeOffsetConverter");
    expect(TO_TEST.from).toBe(ODataTypesV2.DateTime);
    expect(TO_TEST.to).toBe(ODataTypesV4.DateTimeOffset);
  });

  test("conversion", () => {
    expect(TO_TEST.convertFrom(FROM_STRING)).toBe(TO_STRING);
    expect(TO_TEST.convertTo(TO_STRING)).toBe(FROM_STRING);
  });

  test("null and undefined", () => {
    expect(TO_TEST.convertFrom(null)).toBeNull();
    expect(TO_TEST.convertFrom(undefined)).toBeUndefined();
    expect(TO_TEST.convertFrom("WRONG")).toBeUndefined();

    expect(TO_TEST.convertTo(null)).toBeNull();
    expect(TO_TEST.convertTo(undefined)).toBeUndefined();
  });

  test("converting from DateTimeV2 with offset", () => {
    expect(TO_TEST.convertFrom(createWithOffset(90))).toBe(createIsoWithOffset("+01:30"));
    expect(TO_TEST.convertFrom(createWithOffset(60))).toBe(createIsoWithOffset("+01:00"));
    expect(TO_TEST.convertFrom(createWithOffset(50, true))).toBe(createIsoWithOffset("-00:50"));
    expect(TO_TEST.convertFrom(createWithOffset(0))).toBe(createIsoWithOffset("Z"));
  });

  test("conversion to DateTimeV2 with offset", () => {
    const result = TO_TEST.convertTo(createIsoWithOffset("+01:30"));

    expect(result).toBe(`/Date(${TIMESTAMP}+90)/`);
    expect(TO_TEST.convertFrom(result)).toBe(createIsoWithOffset("+01:30"));
  });
});
