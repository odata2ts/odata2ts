import { v2DateTimeToDateConverter } from "../../src";

describe("V2DateTimeToDateConverter Test", () => {
  const TIMESTAMP = 1672531199000;
  const FROM_STRING = `/Date(${TIMESTAMP})/`;
  const TO_STRING = "2022-12-31T23:59:59.000Z";
  const TO_TEST = v2DateTimeToDateConverter;

  test("from v2 datetime string to Date", () => {
    const result = TO_TEST.convertFrom(FROM_STRING);

    expect(TO_TEST.convertFrom(FROM_STRING)?.toISOString()).toBe(TO_STRING);
  });

  test("from Date to v2 datetime", () => {
    expect(TO_TEST.convertTo(new Date(TIMESTAMP))).toBe(FROM_STRING);
  });

  test("null and undefined", () => {
    expect(TO_TEST.convertFrom(null)).toBeNull();
    expect(TO_TEST.convertFrom(undefined)).toBeUndefined();
    expect(TO_TEST.convertFrom("WRONG")).toBeUndefined();

    expect(TO_TEST.convertTo(null)).toBeNull();
    expect(TO_TEST.convertTo(undefined)).toBeUndefined();
  });
});
