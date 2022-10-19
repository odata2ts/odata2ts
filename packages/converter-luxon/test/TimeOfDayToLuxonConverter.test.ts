import { DateTime } from "luxon";

import { timeOfDayToLuxonConverter } from "../src";
import { execCommonConverterTests } from "./CommonTests";

describe("TimeOfDayToLuxonConverter Test", () => {
  const TO_TEST = timeOfDayToLuxonConverter;

  execCommonConverterTests(TO_TEST);

  test("conversion", () => {
    const FROM_STRING = "12:30:45";
    const candidate = TO_TEST.convertFrom(FROM_STRING);
    const candidate2 = DateTime.utc(2022, 12, 31, 12, 30, 45);

    expect(candidate?.toFormat("hh:mm:ss")).toBe(FROM_STRING);

    expect(TO_TEST.convertTo(candidate)).toBe(FROM_STRING);
    expect(TO_TEST.convertTo(candidate2)).toBe(FROM_STRING);
  });

  test("conversion with milliseconds", () => {
    const FROM_STRING = "12:30:45.123";
    const candidate = TO_TEST.convertFrom(FROM_STRING);

    expect(candidate?.toFormat("hh:mm:ss.S")).toBe(FROM_STRING);
    expect(TO_TEST.convertTo(candidate)).toBe(FROM_STRING);
  });
});
