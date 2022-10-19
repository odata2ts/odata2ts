import { DateTime } from "luxon";

import { dateToLuxonConverter } from "../src";
import { execCommonConverterTests } from "./CommonTests";

describe("DateToLuxonConverter Test", () => {
  const FROM_STRING = "2022-12-31";
  const TO_TEST = dateToLuxonConverter;

  execCommonConverterTests(TO_TEST);

  test("conversion", () => {
    const candidate = TO_TEST.convertFrom(FROM_STRING);
    const candidate2 = DateTime.utc(2022, 12, 31);

    expect(candidate?.toFormat("yyyy-MM-dd")).toBe(FROM_STRING);
    expect(candidate2.toFormat("yyyy-MM-dd")).toBe(FROM_STRING);

    expect(TO_TEST.convertTo(candidate)).toBe(FROM_STRING);
    expect(TO_TEST.convertTo(candidate2)).toBe(FROM_STRING);
  });
});
