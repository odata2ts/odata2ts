import { getIdentityConverter } from "@odata2ts/converter-runtime";

import { QStringV2Path } from "../../../src";
import { FIXED_DATE, FIXED_STRING, fixedDateConverter } from "../../fixture/converter/FixedDateConverter";
import { createStringTests } from "../StringBaseTests";

describe("QStringV2Path test", () => {
  const toTest = new QStringV2Path("Country");
  const otherProp = new QStringV2Path("Language");

  createStringTests(toTest, otherProp);

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QStringV2Path(null)).toThrow();
    // @ts-expect-error
    expect(() => new QStringV2Path()).toThrow();
    // @ts-expect-error
    expect(() => new QStringV2Path(undefined)).toThrow();
    expect(() => new QStringV2Path("", getIdentityConverter())).toThrow();
    expect(() => new QStringV2Path(" ", getIdentityConverter())).toThrow();
  });

  test("with converter", () => {
    const testWithConv = new QStringV2Path("Country", fixedDateConverter);

    expect(testWithConv.gt(FIXED_DATE).toString()).toBe(`Country gt '${FIXED_STRING}'`);
  });

  test("contains", () => {
    const result = toTest.contains("ran");

    expect(result.toString()).toBe("substringof('ran',Country)");
  });

  test("contains prop", () => {
    const result = toTest.contains(otherProp);

    expect(result.toString()).toBe("substringof(Language,Country)");
  });
});
