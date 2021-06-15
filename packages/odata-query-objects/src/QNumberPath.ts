import { NumberFilterFunctions, NumberFilterOperators, StandardFilterOperators } from "./ODataModel";

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

  private buildBuiltInOp(operator: StandardFilterOperators | NumberFilterOperators, value: number) {
    return `${this.getPathExpression()} ${operator} ${value}`;
  }

  /* private buildFunc(func: NumberFilterFunctions, value: number) {
    return `${func}(${this.getPathExpression()},${value})`;
  } */

  private buildNoValueFunc(func: NumberFilterFunctions) {
    return `${func}(${this.getPathExpression()})`;
  }

  public equals(value: number) {
    const result = this.buildBuiltInOp(StandardFilterOperators.EQUALS, value);
    this.pathExpression = undefined;
    return result;
  }
  public eq = this.equals;

  public notEquals(value: number) {
    const result = this.buildBuiltInOp(StandardFilterOperators.NOT_EQUALS, value);
    this.pathExpression = undefined;
    return result;
  }
  public ne = this.notEquals;

  public lowerThan(value: number) {
    const result = this.buildBuiltInOp(StandardFilterOperators.LOWER_THAN, value);
    this.pathExpression = undefined;
    return result;
  }
  public lt = this.lowerThan;

  public lowerEquals(value: number) {
    const result = this.buildBuiltInOp(StandardFilterOperators.LOWER_EQUALS, value);
    this.pathExpression = undefined;
    return result;
  }
  public le = this.lowerEquals;

  public greaterThan(value: number) {
    const result = this.buildBuiltInOp(StandardFilterOperators.GREATER_THAN, value);
    this.pathExpression = undefined;
    return result;
  }
  public gt = this.greaterThan;

  public greaterEquals(value: number) {
    const result = this.buildBuiltInOp(StandardFilterOperators.GREATER_EQUALS, value);
    this.pathExpression = undefined;
    return result;
  }
  public ge = this.greaterEquals;

  public plus(value: number) {
    this.pathExpression = this.buildBuiltInOp(NumberFilterOperators.ADDITION, value);
    return this;
  }
  public add = this.plus;

  public minus(value: number) {
    this.pathExpression = this.buildBuiltInOp(NumberFilterOperators.SUBTRACTION, value);
    return this;
  }
  public sub = this.minus;

  public multiply(value: number) {
    this.pathExpression = this.buildBuiltInOp(NumberFilterOperators.MULTIPLICATION, value);
    return this;
  }
  public mul = this.multiply;

  public divide(value: number) {
    this.pathExpression = this.buildBuiltInOp(NumberFilterOperators.DIVISION, value);
    return this;
  }
  public div = this.divide;

  public divideWithFraction(value: number) {
    this.pathExpression = this.buildBuiltInOp(NumberFilterOperators.DIVISION_WITH_FRACTION, value);
    return this;
  }
  public divBy = this.divideWithFraction;

  public modulo(value: number) {
    this.pathExpression = this.buildBuiltInOp(NumberFilterOperators.MODULO, value);
    return this;
  }
  public mod = this.modulo;

  public ceiling() {
    this.pathExpression = this.buildNoValueFunc(NumberFilterFunctions.CEILING);
    return this;
  }
  public floor() {
    this.pathExpression = this.buildNoValueFunc(NumberFilterFunctions.FLOOR);
    return this;
  }
  public round() {
    this.pathExpression = this.buildNoValueFunc(NumberFilterFunctions.ROUND);
    return this;
  }
}
