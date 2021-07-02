import { NumberFilterFunctions, NumberFilterOperators, StandardFilterOperators } from "../odata/ODataModel";
import { QExpression } from "./QExpression";
import { QPathModel } from "./QPathModel";

export class QNumberPath implements QPathModel {
  private pathExpression?: string;

  constructor(private path: string) {
    if (!path || !path.trim()) {
      throw Error("Path must be supplied!");
    }
  }

  public getPath(): string {
    return this.path;
  }

  private getPathExpression(): string {
    return this.pathExpression ?? this.path;
  }

  private buildBuiltInExpression(operator: StandardFilterOperators | NumberFilterOperators, value: number) {
    return new QExpression(this.buildBuiltInOp(operator, value));
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
    const result = this.buildBuiltInExpression(StandardFilterOperators.EQUALS, value);
    this.pathExpression = undefined;
    return result;
  }
  public eq = this.equals;

  public notEquals(value: number) {
    const result = this.buildBuiltInExpression(StandardFilterOperators.NOT_EQUALS, value);
    this.pathExpression = undefined;
    return result;
  }
  public ne = this.notEquals;

  public lowerThan(value: number) {
    const result = this.buildBuiltInExpression(StandardFilterOperators.LOWER_THAN, value);
    this.pathExpression = undefined;
    return result;
  }
  public lt = this.lowerThan;

  public lowerEquals(value: number) {
    const result = this.buildBuiltInExpression(StandardFilterOperators.LOWER_EQUALS, value);
    this.pathExpression = undefined;
    return result;
  }
  public le = this.lowerEquals;

  public greaterThan(value: number) {
    const result = this.buildBuiltInExpression(StandardFilterOperators.GREATER_THAN, value);
    this.pathExpression = undefined;
    return result;
  }
  public gt = this.greaterThan;

  public greaterEquals(value: number) {
    const result = this.buildBuiltInExpression(StandardFilterOperators.GREATER_EQUALS, value);
    this.pathExpression = undefined;
    return result;
  }
  public ge = this.greaterEquals;

  public in(...values: Array<number>) {
    return values.reduce((expression, value) => {
      const expr = this.buildBuiltInExpression(StandardFilterOperators.EQUALS, value);
      return expression ? expression.or(expr) : expr;
    }, null as unknown as QExpression);
  }

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
