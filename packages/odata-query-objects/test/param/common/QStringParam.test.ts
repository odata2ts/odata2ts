import { QStringParam } from "../../../src";
import { ParamValueModel } from "../../../src/param/UrlParamModel";

describe("QStringParam Tests", () => {
  const NAME = "T3st_bbb";
  const TO_TEST = new QStringParam(NAME);

  test("QStringParam: base attributes", () => {
    expect(TO_TEST.getName()).toBe(NAME);
    expect(TO_TEST.getMappedName()).toBe(NAME);
    expect(TO_TEST.getConverter()).toBeUndefined();
  });

  test("QStringParam: formatUrlValue", () => {
    expect(TO_TEST.formatUrlValue("Te3st")).toBe("'Te3st'");
    expect(TO_TEST.formatUrlValue(null)).toBe("null");
    expect(TO_TEST.formatUrlValue(undefined)).toBe(undefined);
  });

  test("QStringParam: parseUrlValue", () => {
    expect(TO_TEST.parseUrlValue("'Te3st'")).toBe("Te3st");
    expect(TO_TEST.parseUrlValue("null")).toBe(null);
    expect(TO_TEST.parseUrlValue(undefined)).toBe(undefined);
  });

  test("QStringParam: fail creation", () => {
    // @ts-expect-error
    expect(() => new QStringParam()).toThrowError();
    // @ts-expect-error
    expect(() => new QStringParam(null)).toThrowError();
  });

  test("QStringParam: mapped name", () => {
    const mappedName = "t3stBbb";
    const toTest = new QStringParam(NAME, mappedName);

    expect(toTest.getName()).toBe(NAME);
    expect(toTest.getMappedName()).toBe(mappedName);
    expect(toTest.getConverter()).toBeUndefined();
  });

  test("QStringParam: converter", () => {
    const toTest = new QStringParam(NAME, undefined, {
      convertFrom(value: ParamValueModel<string>): ParamValueModel<string> {
        return typeof value === "string" ? `PREFIX_${value}` : value;
      },
      convertTo(value: ParamValueModel<string> | undefined): ParamValueModel<string> {
        return typeof value === "string" ? value.replace(/^PREFIX_/, "") : value;
      },
    });
    expect(toTest.getName()).toBe(NAME);
    expect(toTest.getMappedName()).toBe(NAME);
    expect(toTest.getConverter()).toBeDefined();
    expect(toTest.convertTo("PREFIX_Tester")).toBe("Tester");
    expect(toTest.convertFrom("Tester")).toBe("PREFIX_Tester");
    expect(toTest.convertFrom(null)).toBe(null);
    expect(toTest.convertFrom(undefined)).toBeUndefined();
  });

  test("QStringParam: converter to different type", () => {
    const toTest = new QStringParam<number>(NAME, undefined, {
      convertFrom(value: ParamValueModel<string>): number {
        return value?.length || 0;
      },
      convertTo(value: number): ParamValueModel<string> {
        return "three";
      },
    });
    expect(toTest.getName()).toBe(NAME);
    expect(toTest.getMappedName()).toBe(NAME);
    expect(toTest.getConverter()).toBeDefined();
    expect(toTest.convertTo(3)).toBe("three");
    expect(toTest.convertFrom("Tester")).toBe(6);
  });
});
