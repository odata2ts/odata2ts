import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";
import { describe, expect, test } from "vitest";
import { QStringParam } from "../../src";

/**
 * Makes the difference between a URL conversion and a body conversion observable.
 *
 * A converter may legitimately produce different output for the two - `Edm.DateTime` is written as
 * `/Date(<ticks>)/` in a V2 body but never in a URL - so every place building a URL value has to hand
 * the option down.
 */
const urlAwareConverter: ValueConverter<string, string> = {
  id: "urlAwareConverter",
  from: "Edm.String",
  to: "string",

  convertFrom: function (value: ParamValueModel<string>, options?): ParamValueModel<string> {
    return typeof value !== "string" ? value : `${value}|from:${options?.urlConversion ? "url" : "body"}`;
  },

  convertTo: function (value: ParamValueModel<string>, options?): ParamValueModel<string> {
    return typeof value !== "string" ? value : `${value}|to:${options?.urlConversion ? "url" : "body"}`;
  },
};

describe("QParam Tests", () => {
  const toTest = new QStringParam("Test", undefined, urlAwareConverter);

  test("formatUrlValue tells the converter it is converting for a URL", () => {
    // entity keys and function parameters end up in the URL, exactly like a path value does
    expect(toTest.formatUrlValue("x")).toBe("'x|to:url'");
  });

  test("parseUrlValue tells the converter the value came from a URL", () => {
    expect(toTest.parseUrlValue("'x'")).toBe("x|from:url");
  });

  test("the body conversion is left alone", () => {
    // action parameters and response data travel in the body and must not get the URL treatment
    expect(toTest.convertTo("x")).toBe("x|to:body");
    expect(toTest.convertFrom("x")).toBe("x|from:body");
  });

  test("explicitly passed options win over the default", () => {
    expect(toTest.convertTo("x", { urlConversion: true })).toBe("x|to:url");
    expect(toTest.convertFrom("x", { urlConversion: true })).toBe("x|from:url");
  });

  test("collections hand the options down for every entry", () => {
    expect(toTest.formatUrlValue(["x", "y"])).toBe(JSON.stringify(["x|to:url", "y|to:url"]));
    expect(toTest.convertTo(["x", "y"])).toStrictEqual(["x|to:body", "y|to:body"]);
  });

  test("null and undefined stay untouched on either route", () => {
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBeUndefined();
    expect(toTest.convertTo(null)).toBeNull();
    expect(toTest.convertFrom(undefined)).toBeUndefined();
  });
});
