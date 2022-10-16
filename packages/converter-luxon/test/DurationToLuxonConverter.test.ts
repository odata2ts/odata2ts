import { durationToLuxonConverter } from "../src";
import { execCommonConverterTests } from "./CommonTests";

describe("DurationToLuxonConverter Test", () => {
  const TO_TEST = durationToLuxonConverter;

  execCommonConverterTests(TO_TEST);

  test("conversion of day duration", () => {
    const dayDuration = "PT12H15M20S";
    const luxon = TO_TEST.convertFrom(dayDuration);

    expect(luxon?.days).toBe(0);
    expect(luxon?.hours).toBe(12);
    expect(luxon?.minutes).toBe(15);
    expect(luxon?.seconds).toBe(20);
    expect(TO_TEST.convertTo(luxon)).toBe(dayDuration);
  });

  test("conversion of minute and millis duration", () => {
    const duration = "PT15M20.123S";
    const luxon = TO_TEST.convertFrom(duration);

    expect(luxon?.minutes).toBe(15);
    expect(luxon?.seconds).toBe(20);
    expect(luxon?.milliseconds).toBe(123);
    expect(TO_TEST.convertTo(luxon)).toBe(duration);
  });
});
