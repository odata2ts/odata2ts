import { ODataTypesV2, ODataTypesV4 } from "@odata2ts/odata-core";

import { timeToTimeOfDayConverter } from "../src";

describe("TimeToTimeOfDayConverter Test", () => {
  const TO_TEST = timeToTimeOfDayConverter;

  test("base attributes", () => {
    expect(TO_TEST.id).toBe("timeToTimeOfDayConverter");
    expect(TO_TEST.from).toBe(ODataTypesV2.Time);
    expect(TO_TEST.to).toBe(ODataTypesV4.TimeOfDay);
  });

  test("conversion", () => {
    expect(TO_TEST.convertFrom("PT23H59M59S")).toBe("23:59:59");
    expect(TO_TEST.convertTo("23:59:59")).toBe("PT23H59M59S");
  });

  test("null, undefined and invalid input", () => {
    expect(TO_TEST.convertFrom(null)).toBeNull();
    expect(TO_TEST.convertFrom(undefined)).toBeUndefined();
    expect(TO_TEST.convertFrom("WRONG")).toBeUndefined();
    expect(TO_TEST.convertFrom("PD12H")).toBeUndefined();

    expect(TO_TEST.convertTo(null)).toBeNull();
    expect(TO_TEST.convertTo(undefined)).toBeUndefined();
    expect(TO_TEST.convertTo("wrong")).toBeUndefined();
    expect(TO_TEST.convertTo("00")).toBeUndefined();
  });

  test("only hours, minutes or seconds", () => {
    expect(TO_TEST.convertFrom("PT12H")).toBe("12:00");
    expect(TO_TEST.convertTo("12:00")).toBe("PT12H");
    expect(TO_TEST.convertFrom("PT12M")).toBe("00:12");
    expect(TO_TEST.convertTo("00:12")).toBe("PT12M");
    expect(TO_TEST.convertFrom("PT12S")).toBe("00:00:12");
    expect(TO_TEST.convertTo("00:00:12")).toBe("PT12S");

    expect(TO_TEST.convertFrom("PT12H55S")).toBe("12:00:55");
    expect(TO_TEST.convertTo("12:00:55")).toBe("PT12H55S");
    expect(TO_TEST.convertFrom("PT12M55S")).toBe("00:12:55");
    expect(TO_TEST.convertTo("00:12:55")).toBe("PT12M55S");
  });

  test("midnight", () => {
    expect(TO_TEST.convertFrom("PT0H")).toBe("00:00");
    expect(TO_TEST.convertTo("00:00")).toBe("PT0H");
  });

  test("milli seconds", () => {
    expect(TO_TEST.convertFrom("PT12.567S")).toBe("00:00:12.567");
    expect(TO_TEST.convertTo("00:00:12.567")).toBe("PT12.567S");
  });
});
