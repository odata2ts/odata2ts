import { dateToIso8601Converter, v2DateTimeToDateConverter } from "../../src";

describe("ChainedConverter Test", () => {
  const TIMESTAMP = 1672531199000;
  const FROM_STRING = `/Date(${TIMESTAMP})/`;
  const TO_STRING = "2022-12-31T23:59:59.000Z";

  test("Chained Converter: from v2 datetime string via Date to ISO 8601 string", () => {
    const toTest = v2DateTimeToDateConverter.chain(dateToIso8601Converter);

    expect(toTest.convertFrom(FROM_STRING)).toBe(TO_STRING);
  });
});
