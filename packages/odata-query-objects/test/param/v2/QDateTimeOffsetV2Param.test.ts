import { FIXED_DATE, FIXED_STRING, fixedDateConverter } from "@odata2ts/test-converters";

import { QDateTimeOffsetV2Param } from "../../../src";

describe("QDateTimeOffsetV2Param Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QDateTimeOffsetV2Param(name);
  const toTestWithConverter = new QDateTimeOffsetV2Param(name, undefined, fixedDateConverter);

  test("base attributes", () => {
    expect(toTest.getName()).toBe(name);
    expect(toTest.getMappedName()).toBe(name);
    expect(toTest.getConverter()).toBeDefined();
  });

  test("fail creation", () => {
    // @ts-expect-error
    expect(() => new QDateTimeOffsetV2Param()).toThrowError();
    // @ts-expect-error
    expect(() => new QDateTimeOffsetV2Param(null)).toThrowError();
  });

  test("mapped name", () => {
    const test = new QDateTimeOffsetV2Param(name, "xxx");

    expect(test.getName()).toBe(name);
    expect(test.getMappedName()).toBe("xxx");
  });

  test("converter", () => {
    expect(toTestWithConverter.convertFrom("Tester")).toBe(FIXED_DATE);
    expect(toTestWithConverter.convertTo(new Date())).toBe(FIXED_STRING);
  });

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue("test")).toBe("datetimeoffset'test'");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.formatUrlValue(new Date())).toBe(`datetimeoffset'${FIXED_STRING}'`);
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("datetimeoffset'test'")).toBe("test");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.parseUrlValue("datetimeoffset'test'")).toBe(FIXED_DATE);
  });
});
