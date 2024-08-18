import { stringToPrefixModelConverter } from "@odata2ts/test-converters";
import { describe, expect, test } from "vitest";
import { QBinaryV2Param } from "../../../src/param/v2/QBinaryV2Param";

describe("QGuidV2Param Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QBinaryV2Param(name);
  const toTestWithConverter = new QBinaryV2Param(name, undefined, stringToPrefixModelConverter);

  test("base attributes", () => {
    expect(toTest.getName()).toBe(name);
    expect(toTest.getMappedName()).toBe(name);
    expect(toTest.getConverter()).toBeDefined();
  });

  test("fail creation", () => {
    // @ts-expect-error
    expect(() => new QBinaryV2Param()).toThrowError();
    // @ts-expect-error
    expect(() => new QBinaryV2Param(null)).toThrowError();
  });

  test("mapped name", () => {
    const mappedName = "xxx";
    const test = new QBinaryV2Param(name, mappedName);

    expect(test.getName()).toBe(name);
    expect(test.getMappedName()).toBe(mappedName);
  });

  test("converter", () => {
    expect(toTestWithConverter.convertFrom("Tester")).toStrictEqual({ prefix: "PREFIX_", value: "Tester" });
    expect(toTestWithConverter.convertTo({ prefix: "aba", value: "Tester" })).toBe("Tester");
  });

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue("test")).toBe("binary'test'");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.formatUrlValue({ prefix: "any", value: "test" })).toBe(`binary'test'`);
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("binary'test'")).toBe("test");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.parseUrlValue("binary'test'")).toStrictEqual({ prefix: "PREFIX_", value: "test" });
  });
});
