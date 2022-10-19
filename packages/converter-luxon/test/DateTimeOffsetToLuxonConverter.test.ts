import { dateTimeOffsetToLuxonConverter } from "../src";
import { execCommonConverterTests } from "./CommonTests";

describe("DateTimeToLuxonConverter Test", () => {
  const FROM_STRING = "2022-12-31T23:59:59.000Z";
  const FROM_STRING2 = "2022-12-31T23:59:59Z";

  const TO_TEST = dateTimeOffsetToLuxonConverter;

  execCommonConverterTests(TO_TEST);

  test("conversion", () => {
    const candidate = TO_TEST.convertFrom(FROM_STRING);
    const candidate2 = TO_TEST.convertFrom(FROM_STRING2);

    // luxon defaults to local time zone of user => explicitly convert to UTC
    expect(candidate?.toUTC().toISO()).toBe(FROM_STRING);
    expect(candidate2?.toUTC().toISO()).toBe(FROM_STRING);
    // we require a proper ISO8601 string in UTC
    expect(TO_TEST.convertTo(candidate)).toBe(FROM_STRING);
  });
});
