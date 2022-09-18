import { QNumberParam } from "../../../src";
import { fixedNumberConverter } from "../../fixture/converter/FixedNumberConverter";

describe("QNumberParam Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QNumberParam(name);
  const toTestWithConverter = new QNumberParam(name, undefined, fixedNumberConverter);

  test("base attributes", () => {
    expect(toTest.getName()).toBe(name);
    expect(toTest.getMappedName()).toBe(name);
    expect(toTest.getConverter()).toBeDefined();
  });

  test("fail creation", () => {
    // @ts-expect-error
    expect(() => new QNumberParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QNumberParam(null)).toThrowError();
  });

  test("mapped name", () => {
    const test = new QNumberParam(name, "myTest");
    expect(test.getName()).toBe(name);
    expect(test.getMappedName()).toBe("myTest");
  });

  test("converter", () => {
    expect(toTestWithConverter.convertFrom(4)).toBe("4");
    expect(toTestWithConverter.convertTo("23.5")).toBe(23.5);

    expect(toTestWithConverter.convertFrom(null)).toBe("null");
    expect(toTestWithConverter.convertFrom(undefined)).toBe("undefined");
    expect(toTestWithConverter.convertTo(null)).toBe(0);
    expect(toTestWithConverter.convertTo(undefined)).toBeNaN();
  });

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue(33)).toBe("33");
    expect(toTest.formatUrlValue(-33.1233)).toBe("-33.1233");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.formatUrlValue("33")).toBe("33");
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("-33.1233")).toBe(-33.1233);
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.parseUrlValue("-33.1233")).toBe("-33.1233");
  });
});
