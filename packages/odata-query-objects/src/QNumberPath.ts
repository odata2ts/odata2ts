import { StandardFilterOperators, StringFilterFunctions } from "./ODataModel";

export class QNumberPath {
  private path: string;
  private pathExpression?: string;

  constructor(path: string) {
    if (!path || !path.trim()) {
      throw Error("Path must be supplied!");
    }

    this.path = path;
  }

  private getPathExpression(): string {
    return this.pathExpression ?? this.path;
  }

  private buildBuiltInOp(operator: StandardFilterOperators, value: number) {
    return `${this.getPathExpression()} ${operator} ${value}`;
  }

  private buildFunc(func: StringFilterFunctions, value: string) {
    return `${func}(${this.getPathExpression()},${value})`;
  }

  private buildNoValueFunc(func: StringFilterFunctions) {
    return `${func}(${this.getPathExpression()})`;
  }

  public equals(value: number) {
    return this.buildBuiltInOp(StandardFilterOperators.EQUALS, value);
  }
  public eq = this.equals;

  public notEquals(value: number) {
    return this.buildBuiltInOp(StandardFilterOperators.NOT_EQUALS, value);
  }
  public ne = this.notEquals;

  public lowerThan(value: number) {
    return this.buildBuiltInOp(StandardFilterOperators.LOWER_THAN, value);
  }
  public lt = this.lowerThan;

  public lowerEquals(value: number) {
    return this.buildBuiltInOp(StandardFilterOperators.LOWER_EQUALS, value);
  }
  public le = this.lowerEquals;

  public greaterThan(value: number) {
    return this.buildBuiltInOp(StandardFilterOperators.GREATER_THAN, value);
  }
  public gt = this.greaterThan;

  public greaterEquals(value: number) {
    return this.buildBuiltInOp(StandardFilterOperators.GREATER_EQUALS, value);
  }
  public ge = this.greaterEquals;
}
