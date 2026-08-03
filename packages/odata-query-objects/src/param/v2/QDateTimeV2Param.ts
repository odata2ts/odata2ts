import { QParam } from "../QParam";
import { formatParamWithTypePrefix, parseWithTypePrefix } from "../UrlParamHelper";
import { UrlParamValueFormatter, UrlParamValueParser } from "../UrlParamModel";

export const DATE_TIME_V2_TYPE_PREFIX = "datetime";

const ZONE_DESIGNATOR = /(?:Z|[+-]\d{2}:?\d{2})$/;

/**
 * Brings an ISO-8601 value into the shape V2's `datetime` literal allows.
 *
 * `Edm.DateTime` is timezone-less in V2 - its ABNF has no offset at all, so `Z` and `+02:00` are both
 * invalid inside `datetime'...'` and a strict server answers 400. A converter, however, maps the value
 * onto a real date type and hands back a full ISO string, designator included. Rather than asking every
 * converter to know about V2 URL syntax, the designator is resolved here: a value carrying one is
 * normalised to UTC and the designator dropped, so the instant is preserved.
 *
 * Values without a designator are passed through untouched, which covers the unconverted case where the
 * caller supplies the literal body themselves.
 */
export function toDateTimeV2UrlValue(value: string): string {
  if (!ZONE_DESIGNATOR.test(value)) {
    return value;
  }
  const asUtc = new Date(value);
  if (isNaN(asUtc.getTime())) {
    return value.replace(ZONE_DESIGNATOR, "");
  }
  // toISOString always ends in "Z" and always carries milliseconds; V2 allows fractional seconds but
  // they are noise when zero, and some servers are picky about them
  return asUtc
    .toISOString()
    .replace(/\.000Z$/, "")
    .replace(/Z$/, "");
}

const getUrlConformValue: UrlParamValueFormatter<string> = (value) => {
  return formatParamWithTypePrefix(
    DATE_TIME_V2_TYPE_PREFIX,
    typeof value === "string" ? toDateTimeV2UrlValue(value) : value,
  );
};

const parseValueFromUrl: UrlParamValueParser<string> = (urlConformValue) => {
  return parseWithTypePrefix(DATE_TIME_V2_TYPE_PREFIX, urlConformValue);
};

export class QDateTimeV2Param<ConvertedType = string> extends QParam<string, ConvertedType> {
  getUrlConformValue = getUrlConformValue;
  parseValueFromUrl = parseValueFromUrl;
}
