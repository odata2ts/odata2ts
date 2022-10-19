import { ODataTypesV2 } from "@odata2ts/odata-core";

import { stringToNumberConverter } from "../src";

describe("StringToNumberConverter Test", () => {
  const TO_TEST = stringToNumberConverter;

  test("base attributes", () => {
    expect(TO_TEST.id).toBe("stringToNumberConverter");
    expect(TO_TEST.from).toStrictEqual([
      ODataTypesV2.Byte,
      ODataTypesV2.SByte,
      ODataTypesV2.Single,
      ODataTypesV2.Double,
      ODataTypesV2.Int64,
      ODataTypesV2.Decimal,
    ]);
    expect(TO_TEST.to).toBe("number");
  });

  test("conversion", () => {
    expect(TO_TEST.convertFrom("12.59")).toBe(12.59);
    expect(TO_TEST.convertTo(12.59)).toBe("12.59");
    expect(TO_TEST.convertFrom("2.00")).toBe(2);
    expect(TO_TEST.convertTo(2)).toBe("2");
    expect(TO_TEST.convertFrom("-46")).toBe(-46);
    expect(TO_TEST.convertTo(-21.5)).toBe("-21.5");
  });

  test("null, undefined and invalid input", () => {
    expect(TO_TEST.convertFrom(null)).toBeNull();
    expect(TO_TEST.convertFrom(undefined)).toBeUndefined();
    expect(TO_TEST.convertFrom("WRONG")).toBeUndefined();
    expect(TO_TEST.convertFrom("1,3")).toBeUndefined();

    expect(TO_TEST.convertTo(null)).toBeNull();
    expect(TO_TEST.convertTo(undefined)).toBeUndefined();
    expect(TO_TEST.convertTo(Number("oh my!"))).toBeUndefined();
  });

  test("conversion limits", () => {
    expect(TO_TEST.convertFrom("12345678901234567")).toBe(12345678901234568);
    expect(TO_TEST.convertFrom("-1.23456789012345678")).toBe(-1.2345678901234568);
  });
});
