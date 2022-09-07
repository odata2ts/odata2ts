import { StandardFilterOperators } from "../../odata/ODataModel";
import { QFilterExpression } from "../../QFilterExpression";
import { QOrderByExpression } from "../../QOrderByExpression";
import { QPathModel } from "../QPathModel";
import { UrlParamModel } from "../../param/UrlParamModel";
import { getExpressionValue } from "../../param/UrlParamHelper";

export abstract class DateTimeBasePath implements QPathModel {
  constructor(private path: string) {
    if (!path || !path.trim()) {
      throw new Error("Path must be supplied!");
    }
  }

  protected abstract getUrlParamConfig(): UrlParamModel | undefined;

  private buildBuiltInOp(operator: StandardFilterOperators, value: string | this) {
    return new QFilterExpression(`${this.path} ${operator} ${getExpressionValue(value, this.getUrlParamConfig())}`);
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

  public isNull() {
    return new QFilterExpression(`${this.path} eq null`);
  }

  public isNotNull() {
    return new QFilterExpression(`${this.path} ne null`);
  }

  public equals(value: string | null | this) {
    if (value === null) {
      return this.isNull();
    }
    return this.buildBuiltInOp(StandardFilterOperators.EQUALS, value);
  }
  public eq = this.equals;

  public notEquals(value: string | null | this) {
    if (value === null) {
      return this.isNotNull();
    }
    return this.buildBuiltInOp(StandardFilterOperators.NOT_EQUALS, value);
  }
  public ne = this.notEquals;

  public lowerThan(value: string | this) {
    return this.buildBuiltInOp(StandardFilterOperators.LOWER_THAN, value);
  }
  public lt = this.lowerThan;

  public lowerEquals(value: string | this) {
    return this.buildBuiltInOp(StandardFilterOperators.LOWER_EQUALS, value);
  }
  public le = this.lowerEquals;

  public greaterThan(value: string | this) {
    return this.buildBuiltInOp(StandardFilterOperators.GREATER_THAN, value);
  }
  public gt = this.greaterThan;

  public greaterEquals(value: string | this) {
    return this.buildBuiltInOp(StandardFilterOperators.GREATER_EQUALS, value);
  }
  public ge = this.greaterEquals;

  public in(...values: Array<string | this>) {
    return values.reduce((expression, value) => {
      const expr = this.buildBuiltInOp(StandardFilterOperators.EQUALS, value);
      return expression ? expression.or(expr) : expr;
    }, null as unknown as QFilterExpression);
  }
}
