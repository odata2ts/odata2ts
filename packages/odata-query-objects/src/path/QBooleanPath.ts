import { StandardFilterOperators } from "../odata/ODataModel";
import { QLiteralPath } from "./base/QLiteralPath";
import { getParamValue, parseParamValue } from "../param/UrlParamHelper";
import { UrlParamValueFormatter, UrlParamValueParser } from "../param/UrlParamModel";

export class QBooleanPath extends QLiteralPath<boolean | QBooleanPath, StandardFilterOperators> {
  public static getUrlConformValue: UrlParamValueFormatter<boolean> = (value) => {
    return getParamValue(value);
  };

  public static parseValueFromUrl: UrlParamValueParser<boolean> = (urlConformValue) => {
    const value = parseParamValue(urlConformValue);
    return typeof value !== "string" ? value : value === "true" ? true : value === "false" ? false : undefined;
  };

  public equals(value: boolean) {
    return this.buildBuiltInExpression(StandardFilterOperators.EQUALS, value);
  }
  public eq = this.equals;

  public isTrue() {
    return this.equals(true);
  }

  public isFalse() {
    return this.equals(false);
  }
}
