import { FIXED_DATE, FIXED_STRING } from "@odata2ts/test-converters";

import { QSimpleEntityWithConverter } from "./fixture/SimpleEntityWithConverter";

describe("QueryObject tests", () => {
  const qToTest = new QSimpleEntityWithConverter();

  test("convertFromOData: full model", () => {
    const result = qToTest.convertFromOData({
      ID: 123,
      truth: true,
      AGE: 33,
      Test: { NAME: "test", CREATED_AT: "1999-12-31" },
    });
    expect(result).toStrictEqual({
      id: 123,
      truth: 1,
      age: "33",
      test: { name: "test", createdAt: FIXED_DATE },
    });
  });

  test("convertFromOData: partial model", () => {
    const result = qToTest.convertFromOData({ AGE: 33 });
    expect(result).toStrictEqual({ age: "33" });
  });

  test("fail convertFromOData", () => {
    // @ts-expect-error
    expect(() => qToTest.convertFromOData(null)).toThrow();
    // @ts-expect-error
    expect(() => qToTest.convertFromOData(undefined)).toThrow();
    // @ts-expect-error
    expect(() => qToTest.convertFromOData("2")).toThrow();
  });

  test("convertFromOData: permissiveness", () => {
    const result = qToTest.convertFromOData({ id: 123, unknownProp: "hi!" });
    expect(result).toStrictEqual({
      id: 123,
      unknownProp: "hi!",
    });
  });

  test("convertToOData: full model", () => {
    const result = qToTest.convertToOData({
      id: 123,
      truth: 1,
      age: "33",
      test: { name: "test", createdAt: FIXED_DATE },
    });
    expect(result).toStrictEqual({
      ID: 123,
      truth: true,
      AGE: 33,
      Test: { NAME: "test", CREATED_AT: FIXED_STRING },
    });
  });

  test("convertToOData: partial model", () => {
    const result = qToTest.convertToOData({ id: 123 });
    expect(result).toStrictEqual({ ID: 123 });
  });

  test("fail convertToOData", () => {
    // @ts-expect-error
    expect(() => qToTest.convertToOData(null)).toThrow();
    // @ts-expect-error
    expect(() => qToTest.convertToOData(undefined)).toThrow();
    // @ts-expect-error
    expect(() => qToTest.convertToOData("2")).toThrow();
  });

  test("convertToOData: strict => no wrong or extra props allowed", () => {
    expect(() => {
      // @ts-expect-error
      return qToTest.convertToOData({ ID: 123 });
    }).toThrow("Property [ID] not found");
    expect(() => {
      // @ts-expect-error
      return qToTest.convertToOData({ unknownProp: "hi!" });
    }).toThrow("Known user model props: id,truth,age,test");
  });
});
