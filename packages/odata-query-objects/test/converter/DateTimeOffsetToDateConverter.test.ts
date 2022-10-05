import dateTimeOffsetToDateConverter from "../../src/converter/DateTimeOffsetToDateConverter";

describe("DateTimeOffsetToDateConverter Test", () => {
  const FROM_STRING = "2022-12-31T23:59:59.000Z";
  const TO_DATE = new Date(FROM_STRING);
  const TO_TEST = dateTimeOffsetToDateConverter;

  test("test conversion", () => {
    expect(TO_TEST.convertFrom(FROM_STRING)).toStrictEqual(TO_DATE);
    expect(TO_TEST.convertTo(TO_DATE)).toStrictEqual(FROM_STRING);
  });

  test("test null and undefined", () => {
    expect(TO_TEST.convertFrom(null)).toBeNull();
    expect(TO_TEST.convertFrom(undefined)).toBeUndefined();

    expect(TO_TEST.convertTo(null)).toBeNull();
    expect(TO_TEST.convertTo(undefined)).toBeUndefined();
  });
});
