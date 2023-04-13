import { stringToPrefixModelConverter } from "@odata2ts/test-converters";

import { QStringPath } from "../../../src";
import { getIdentityConverter } from "../../../src/IdentityConverter";
import { createStringTests } from "../StringBaseTests";

describe("QStringPath test", () => {
  const toTest = new QStringPath("Country");
  const otherProp = new QStringPath("Language");

  createStringTests(toTest, otherProp);

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QStringPath(null)).toThrow();
    // @ts-expect-error
    expect(() => new QStringPath()).toThrow();
    // @ts-expect-error
    expect(() => new QStringPath(undefined)).toThrow();
    expect(() => new QStringPath("", getIdentityConverter())).toThrow();
    expect(() => new QStringPath(" ", getIdentityConverter())).toThrow();
  });

  test("with converter", () => {
    const testWithConv = new QStringPath("ID", stringToPrefixModelConverter);

    expect(testWithConv.gt({ prefix: "_", value: "a" }).toString()).toBe(`ID gt 'a'`);
  });

  test("contains", () => {
    const result = toTest.contains("ran");

    expect(result.toString()).toBe("contains(Country,'ran')");
  });

  test("contains prop", () => {
    const result = toTest.contains(otherProp);

    expect(result.toString()).toBe("contains(Country,Language)");
  });

  test("matchesPattern", () => {
    const result = toTest.matchesPattern("[A-Za-z]+");

    expect(result.toString()).toBe("matchesPattern(Country,'[A-Za-z]+')");
  });

  test("matchesPattern prop", () => {
    const result = toTest.matchesPattern(otherProp);

    expect(result.toString()).toBe("matchesPattern(Country,Language)");
  });
});
