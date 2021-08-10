import { QOrderByExpression } from "./../QOrderByExpression";
import { StandardFilterOperators, StringFilterFunctions } from "../odata/ODataModel";
import { QPathModel } from "./QPathModel";
import { QFilterExpression } from "../QFilterExpression";

export class QEnumPath implements QPathModel {
  constructor(private path: string) {
    if (!path || !path.trim()) {
      throw Error("Path must be supplied!");
    }
  }

  private buildBuiltInOp(operator: StandardFilterOperators, value: string) {
    return new QFilterExpression(`${this.path} ${operator} '${value}'`);
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
