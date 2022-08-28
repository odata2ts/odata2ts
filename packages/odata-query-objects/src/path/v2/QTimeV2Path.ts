import { DateTimeBasePath } from "./DateTimeBase";
import { hourFn, minuteFn, secondFn } from "../base/DateTimeFunctions";
import { UrlParamModel, UrlParamValueFormatter, UrlParamValueParser } from "../../param/UrlParamModel";
import { createParsingRegexp, getParamValue, parseParamValue } from "../../param/UrlParamHelper";

const URL_PARAM_CONFIG: UrlParamModel = { typePrefix: "time" };
const URL_PARAM_REGEXP = createParsingRegexp(URL_PARAM_CONFIG);

export class QTimeV2Path extends DateTimeBasePath {
  public static getUrlConformValue: UrlParamValueFormatter<string> = (value) => {
    return getParamValue(value, URL_PARAM_CONFIG);
  };

  public static parseValueFromUrl: UrlParamValueParser<string> = (urlConformValue) => {
    return parseParamValue(urlConformValue, URL_PARAM_REGEXP);
  };

  protected getUrlParamConfig() {
    return URL_PARAM_CONFIG;
  }

  public hour = hourFn(this.getPath());
  public minute = minuteFn(this.getPath());
  public second = secondFn(this.getPath());
}
