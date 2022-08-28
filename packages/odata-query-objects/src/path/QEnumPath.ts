import { QOrderByExpression } from "../QOrderByExpression";
import { StandardFilterOperators } from "../odata/ODataModel";
import { QPathModel } from "./QPathModel";
import { QFilterExpression } from "../QFilterExpression";
import { createParsingRegexp, getParamValue, parseParamValue } from "../param/UrlParamHelper";
import { UrlParamModel, UrlParamValueFormatter, UrlParamValueParser } from "../param/UrlParamModel";

const URL_PARAM_CONFIG: UrlParamModel = { isQuoted: true };
const URL_PARAM_REGEXP = createParsingRegexp(URL_PARAM_CONFIG);

export class QEnumPath implements QPathModel {
  public static getUrlConformValue: UrlParamValueFormatter<string> = (value) => {
    return getParamValue(value, URL_PARAM_CONFIG);
  };

  public static parseValueFromUrl: UrlParamValueParser<string> = (urlConformValue) => {
    return parseParamValue(urlConformValue, URL_PARAM_REGEXP);
  };

  constructor(private path: string) {
    if (!path || !path.trim()) {
      throw new Error("Path must be supplied!");
    }
  }

  private buildBuiltInOp(operator: StandardFilterOperators, value: string) {
    return new QFilterExpression(`${this.path} ${operator} ${QEnumPath.getUrlConformValue(value)}`);
  }

  /**
   * Get the path to this property.
   *
   * @returns this property path
   */
  public getPath(): string {
    return this.path;
  }

  /**
   * Order by this property in ascending order.
   *
   * @returns orderby expression
   */
  public ascending() {
    return new QOrderByExpression(`${this.path} asc`);
  }
  public asc = this.ascending;

  /**
   * Order by this property in descending order.
   *
   * @returns orderby expression
   */
  public descending() {
    return new QOrderByExpression(`${this.path} desc`);
  }
  public desc = this.descending;

  public equals(value: string) {
    return this.buildBuiltInOp(StandardFilterOperators.EQUALS, value);
  }
  public eq = this.equals;

  public notEquals(value: string) {
    return this.buildBuiltInOp(StandardFilterOperators.NOT_EQUALS, value);
  }
  public ne = this.notEquals;

  public in(...values: Array<string>) {
    return values.reduce((expression, value) => {
      const expr = this.buildBuiltInOp(StandardFilterOperators.EQUALS, value);
      return expression ? expression.or(expr) : expr;
    }, null as unknown as QFilterExpression);
  }
}
