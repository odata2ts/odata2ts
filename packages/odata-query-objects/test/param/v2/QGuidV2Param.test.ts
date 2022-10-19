import { FIXED_DATE, FIXED_STRING, fixedDateConverter } from "@odata2ts/test-converters";

import { QGuidV2Param } from "../../../src";

describe("QGuidV2Param Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QGuidV2Param(name);
  const toTestWithConverter = new QGuidV2Param(name, undefined, fixedDateConverter);

  test("base attributes", () => {
    expect(toTest.getName()).toBe(name);
    expect(toTest.getMappedName()).toBe(name);
    expect(toTest.getConverter()).toBeDefined();
  });

  test("fail creation", () => {
    // @ts-expect-error
    expect(() => new QGuidV2Param()).toThrowError();
    // @ts-expect-error
    expect(() => new QGuidV2Param(null)).toThrowError();
  });

  test("mapped name", () => {
    const test = new QGuidV2Param(name, "xxx");

    expect(test.getName()).toBe(name);
    expect(test.getMappedName()).toBe("xxx");
  });

  test("converter", () => {
    expect(toTestWithConverter.convertFrom("Tester")).toBe(FIXED_DATE);
    expect(toTestWithConverter.convertTo(new Date())).toBe(FIXED_STRING);
  });

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue("test")).toBe("guid'test'");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.formatUrlValue(new Date())).toBe(`guid'${FIXED_STRING}'`);
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("guid'test'")).toBe("test");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.parseUrlValue("guid'test'")).toBe(FIXED_DATE);
  });
});
