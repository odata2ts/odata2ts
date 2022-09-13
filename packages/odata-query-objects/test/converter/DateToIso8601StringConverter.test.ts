import { dateToIso8601Converter } from "../../src";

describe("DateToIso8601Converter Test", () => {
  const TO_STRING = "2022-12-31T23:59:59.000Z";
  const FROM_DATE = new Date(TO_STRING);
  const TO_TEST = dateToIso8601Converter;

  test("test conversion", () => {
    expect(TO_TEST.convertFrom(FROM_DATE)).toStrictEqual(TO_STRING);
    expect(TO_TEST.convertTo(TO_STRING)).toStrictEqual(FROM_DATE);
  });

  test("test null and undefined", () => {
    expect(TO_TEST.convertFrom(null)).toBeNull();
    expect(TO_TEST.convertFrom(undefined)).toBeUndefined();

    expect(TO_TEST.convertTo(null)).toBeNull();
    expect(TO_TEST.convertTo(undefined)).toBeUndefined();
  });
});
