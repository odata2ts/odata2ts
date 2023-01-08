import { FIXED_DATE, FIXED_STRING } from "@odata2ts/test-converters";

import { QSimpleEntityWithConverter, QTestEntity } from "./fixture/SimpleEntityWithConverter";

describe("QueryObject tests", () => {
  const qToTest = new QSimpleEntityWithConverter();
  const qToTestWithAssoc = new QTestEntity();

  test("convertFromOData: full model", () => {
    const result = qToTest.convertFromOData({
      ID: 123,
      truth: true,
      AGE: 33,
    });
    expect(result).toStrictEqual({
      id: 123,
      truth: 1,
      age: "33",
    });
  });

  test("convertFromOData: partial model", () => {
    const result = qToTest.convertFromOData({ AGE: 33 });
    expect(result).toStrictEqual({ age: "33" });
  });

  test("convertFromOData: null and undefined pass as they are", () => {
    expect(qToTest.convertFromOData(null)).toBeNull();
    expect(qToTest.convertFromOData(undefined)).toBeUndefined();
  });

  test("fail convertFromOData: must be an object", () => {
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

  test("convertFromOData: nesting", () => {
    const result = qToTestWithAssoc.convertFromOData({
      CREATED_AT: "1999-12-31",
      simple: { ID: 123, truth: false },
      simpleList: [
        { ID: 456, truth: true },
        { ID: 789, truth: false },
      ],
    });
    expect(result).toStrictEqual({
      createdAt: FIXED_DATE,
      simpleEntity: { id: 123, truth: 0 },
      simpleEntities: [
        { id: 456, truth: 1 },
        { id: 789, truth: 0 },
      ],
    });
  });

  test("convertFromOData: special values", () => {
    const result = qToTestWithAssoc.convertFromOData({
      NAME: null,
      simple: undefined,
      simpleList: [],
      options: [true],
    });
    expect(result).toStrictEqual({
      name: null,
      simpleEntity: undefined,
      simpleEntities: [],
      options: [1],
    });
    expect(qToTestWithAssoc.convertFromOData({ options: null })).toStrictEqual({ options: null });
    expect(qToTestWithAssoc.convertFromOData({ options: undefined })).toStrictEqual({ options: undefined });
  });

  test("convertToOData: full model", () => {
    const result = qToTest.convertToOData({
      id: 123,
      truth: 1,
      age: "33",
    });
    expect(result).toStrictEqual({
      ID: 123,
      truth: true,
      AGE: 33,
    });
  });

  test("convertToOData: partial model", () => {
    const result = qToTest.convertToOData({ id: 123 });
    expect(result).toStrictEqual({ ID: 123 });
  });

  test("convertToOData: null and undefined", () => {
    expect(qToTest.convertToOData(null)).toBeNull();
    expect(qToTest.convertToOData(null, true)).toBeNull();
    expect(qToTest.convertToOData(undefined)).toBeUndefined();
    expect(qToTest.convertToOData(undefined, true)).toBeUndefined();
  });

  test("fail convertToOData", () => {
    // @ts-expect-error
    expect(() => qToTest.convertToOData("2")).toThrow("must be an object");
  });

  test("convertToOData: strict => no wrong or extra props allowed", () => {
    expect(() => {
      // @ts-expect-error
      return qToTest.convertToOData({ ID: 123 });
    }).toThrow("Property [ID] not found");
    expect(() => {
      // @ts-expect-error
      return qToTest.convertToOData({ unknownProp: "hi!" });
    }).toThrow("Known user model props: id,truth,age");
  });

  test("convertToOData: permissiveness", () => {
    // @ts-ignore: on purpose in order to pass an unknown property
    const result = qToTest.convertToOData({ id: 123, unknownProp: "hi!" }, true);
    expect(result).toStrictEqual({
      ID: 123,
      unknownProp: "hi!",
    });
  });

  test("convertToOData: nesting", () => {
    const result = qToTestWithAssoc.convertToOData({
      createdAt: FIXED_DATE,
      simpleEntity: { id: 123, truth: 0 },
      simpleEntities: [
        { id: 456, truth: 1 },
        { id: 789, truth: 0 },
      ],
    });
    expect(result).toStrictEqual({
      CREATED_AT: FIXED_STRING,
      simple: { ID: 123, truth: false },
      simpleList: [
        { ID: 456, truth: true },
        { ID: 789, truth: false },
      ],
    });
  });

  test("convertToOData: special values", () => {
    const result = qToTestWithAssoc.convertToOData({
      name: undefined,
      simpleEntity: undefined,
      simpleEntities: [],
      options: [1],
    });
    expect(result).toStrictEqual({
      NAME: undefined,
      simple: undefined,
      simpleList: [],
      options: [true],
    });
    // @ts-expect-error
    expect(qToTestWithAssoc.convertToOData({ options: null })).toStrictEqual({ options: null });
    expect(qToTestWithAssoc.convertToOData({ options: undefined })).toStrictEqual({ options: undefined });
  });
});
