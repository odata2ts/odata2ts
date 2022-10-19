import { ODataTypesV2, ODataTypesV4 } from "@odata2ts/odata-core";

import { timeToDurationConverter } from "../src";

describe("TimeToDurationConverter Test", () => {
  const TO_TEST = timeToDurationConverter;

  test("base attributes", () => {
    expect(TO_TEST.id).toBe("timeToDurationConverter");
    expect(TO_TEST.from).toBe(ODataTypesV2.Time);
    expect(TO_TEST.to).toBe(ODataTypesV4.Duration);
  });

  test("conversion", () => {
    const val = "PT23H59M59S";
    expect(TO_TEST.convertFrom(val)).toBe(val);
    expect(TO_TEST.convertTo(val)).toBe(val);
  });

  test("null, undefined and invalid input", () => {
    expect(TO_TEST.convertFrom(null)).toBeNull();
    expect(TO_TEST.convertFrom(undefined)).toBeUndefined();

    expect(TO_TEST.convertTo(null)).toBeNull();
    expect(TO_TEST.convertTo(undefined)).toBeUndefined();
  });
});
