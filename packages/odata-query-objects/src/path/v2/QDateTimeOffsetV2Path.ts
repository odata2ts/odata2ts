import { DateTimeBasePath } from "./DateTimeBase";
import { dayFn, hourFn, minuteFn, monthFn, secondFn, yearFn } from "../base/DateTimeFunctions";
import { UrlParamModel, UrlParamValueFormatter, UrlParamValueParser } from "../../param/UrlParamModel";
import { createParsingRegexp, getParamValue, parseParamValue } from "../../param/UrlParamHelper";

const URL_PARAM_CONFIG: UrlParamModel = { typePrefix: "datetimeoffset" };
const URL_PARAM_REGEXP = createParsingRegexp(URL_PARAM_CONFIG);

export class QDateTimeOffsetV2Path extends DateTimeBasePath {
  public static getUrlConformValue: UrlParamValueFormatter<string> = (value) => {
    return getParamValue(value, URL_PARAM_CONFIG);
  };

  public static parseValueFromUrl: UrlParamValueParser<string> = (urlConformValue) => {
    return parseParamValue(urlConformValue, URL_PARAM_REGEXP);
  };

  protected getUrlParamConfig() {
    return URL_PARAM_CONFIG;
  }

  public year = yearFn(this.getPath());
  public month = monthFn(this.getPath());
  public day = dayFn(this.getPath());

  public hour = hourFn(this.getPath());
  public minute = minuteFn(this.getPath());
  public second = secondFn(this.getPath());
}
