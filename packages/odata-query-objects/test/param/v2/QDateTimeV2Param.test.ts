import { FIXED_DATE, FIXED_STRING, fixedDateConverter } from "@odata2ts/test-converters";
import { describe, expect, test } from "vitest";
import { QDateTimeV2Param, toDateTimeV2UrlValue } from "../../../src";

/** The same instant as FIXED_STRING, in the timezone-less form V2's `datetime` literal requires. */
const FIXED_STRING_URL = FIXED_STRING.replace(/\.000Z$/, "").replace(/Z$/, "");

describe("QDateTimeV2Param Tests", () => {
  const name = "T3st_bbb";
  const toTest = new QDateTimeV2Param(name);
  const toTestWithConverter = new QDateTimeV2Param(name, undefined, fixedDateConverter);

  test("base attributes", () => {
    expect(toTest.getName()).toBe(name);
    expect(toTest.getMappedName()).toBe(name);
    expect(toTest.getConverter()).toBeDefined();
  });

  test("fail creation", () => {
    // @ts-expect-error
    expect(() => new QDateTimeV2Param()).toThrowError();
    // @ts-expect-error
    expect(() => new QDateTimeV2Param(null)).toThrowError();
  });

  test("mapped name", () => {
    const test = new QDateTimeV2Param(name, "xxx");

    expect(test.getName()).toBe(name);
    expect(test.getMappedName()).toBe("xxx");
  });

  test("converter", () => {
    expect(toTestWithConverter.convertFrom("Tester")).toBe(FIXED_DATE);
    expect(toTestWithConverter.convertTo(new Date())).toBe(FIXED_STRING);
  });

  test("formatUrlValue", () => {
    expect(toTest.formatUrlValue("test")).toBe("datetime'test'");
    expect(toTest.formatUrlValue(null)).toBe("null");
    expect(toTest.formatUrlValue(undefined)).toBe(undefined);

    /*
     * The converted value arrives as a full ISO string, but V2's `datetime` literal is timezone-less -
     * its ABNF has no offset - so the designator is dropped on the way into the URL and the instant is
     * normalised to UTC. A strict V2 server answers 400 for the ISO form.
     */
    expect(toTestWithConverter.formatUrlValue(new Date())).toBe(`datetime'${FIXED_STRING_URL}'`);
  });

  describe("toDateTimeV2UrlValue", () => {
    /*
     * V2's `datetime` literal is timezone-less: `Edm.DateTime` carries no offset and its ABNF has no
     * place for one, so anything a converter hands back has to be brought into that shape before it is
     * wrapped. These cover the four ways a value can arrive.
     */
    test("a value without a designator is passed through", () => {
      // the unconverted case: the caller supplies the literal body themselves
      expect(toDateTimeV2UrlValue("2006-11-05T00:00:00")).toBe("2006-11-05T00:00:00");
      expect(toDateTimeV2UrlValue("2006-11-05T00:00:00.123")).toBe("2006-11-05T00:00:00.123");
    });

    test("a UTC designator is dropped, and so are zero milliseconds", () => {
      expect(toDateTimeV2UrlValue("2006-11-05T00:00:00Z")).toBe("2006-11-05T00:00:00");
      expect(toDateTimeV2UrlValue("2006-11-05T00:00:00.000Z")).toBe("2006-11-05T00:00:00");
      // non-zero milliseconds are kept: V2 allows fractional seconds, it is only the zone that cannot stay
      expect(toDateTimeV2UrlValue("2006-11-05T00:00:00.123Z")).toBe("2006-11-05T00:00:00.123");
    });

    test("an offset is resolved rather than truncated", () => {
      // the instant has to survive: 02:00+02:00 is 00:00 UTC, not 02:00
      expect(toDateTimeV2UrlValue("2006-11-05T02:00:00+02:00")).toBe("2006-11-05T00:00:00");
      expect(toDateTimeV2UrlValue("2006-11-04T21:00:00-03:00")).toBe("2006-11-05T00:00:00");
      // the compact spelling of an offset counts too
      expect(toDateTimeV2UrlValue("2006-11-05T02:00:00+0200")).toBe("2006-11-05T00:00:00");
    });

    test("a value that carries a designator but cannot be parsed keeps its body", () => {
      // nothing sensible can be computed, so the designator is removed and the rest left alone -
      // better a literal the server can reject than a crash inside the client
      expect(toDateTimeV2UrlValue("not-a-date-at-allZ")).toBe("not-a-date-at-all");
      expect(toDateTimeV2UrlValue("2006-13-45T99:99:99Z")).toBe("2006-13-45T99:99:99");
    });
  });

  test("parseUrlValue", () => {
    expect(toTest.parseUrlValue("datetime'test'")).toBe("test");
    expect(toTest.parseUrlValue("null")).toBe(null);
    expect(toTest.parseUrlValue(undefined)).toBe(undefined);

    expect(toTestWithConverter.parseUrlValue("datetime'test'")).toBe(FIXED_DATE);
  });
});
