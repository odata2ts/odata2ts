import { QExpression } from "./QExpression";
import { QPathModel } from "./QPathModel";
import { StandardFilterOperators } from "../odata/ODataModel";

export class QGuidPath implements QPathModel {
  constructor(private path: string) {
    if (!path || !path.trim()) {
      throw Error("Path must be supplied!");
    }
  }

  public getPath(): string {
    return this.path;
  }

  private buildBuiltInOp(operator: StandardFilterOperators, value: string) {
    return `${this.getPath()} ${operator} ${value}`;
  }

  private buildBuiltInExpression(operator: StandardFilterOperators, value: string) {
    return new QExpression(this.buildBuiltInOp(operator, value));
  }

  public equals(value: string) {
    return this.buildBuiltInExpression(StandardFilterOperators.EQUALS, value);
  }
  public eq = this.equals;

  public notEquals(value: string) {
    return this.buildBuiltInExpression(StandardFilterOperators.NOT_EQUALS, value);
  }
  public ne = this.notEquals;

  public lowerThan(value: string) {
    return this.buildBuiltInExpression(StandardFilterOperators.LOWER_THAN, value);
  }
  public lt = this.lowerThan;

  public lowerEquals(value: string) {
    return this.buildBuiltInExpression(StandardFilterOperators.LOWER_EQUALS, value);
  }
  public le = this.lowerEquals;

  public greaterThan(value: string) {
    return this.buildBuiltInExpression(StandardFilterOperators.GREATER_THAN, value);
  }
  public gt = this.greaterThan;

  public greaterEquals(value: string) {
    return this.buildBuiltInExpression(StandardFilterOperators.GREATER_EQUALS, value);
  }
  public ge = this.greaterEquals;

  public in(...values: Array<string>) {
    return values.reduce((expression, value) => {
      const expr = this.buildBuiltInExpression(StandardFilterOperators.EQUALS, value);
      return expression ? expression.or(expr) : expr;
    }, null as unknown as QExpression);
  }
}