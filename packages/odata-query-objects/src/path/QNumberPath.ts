import { NumberFilterFunctions, NumberFilterOperators, StandardFilterOperators } from "../odata/ODataModel";
import { QLiteralPath } from "./base/QLiteralPath";
import { QFilterExpression } from "../QFilterExpression";

export class QNumberPath extends QLiteralPath<number, StandardFilterOperators | NumberFilterOperators> {
  private buildNoValueFunc(func: NumberFilterFunctions) {
    return `${func}(${this.getPath()})`;
  }

  public equals(value: number) {
    return this.buildBuiltInExpression(StandardFilterOperators.EQUALS, value);
  }
  public eq = this.equals;

  public notEquals(value: number) {
    return this.buildBuiltInExpression(StandardFilterOperators.NOT_EQUALS, value);
  }
  public ne = this.notEquals;

  public lowerThan(value: number) {
    return this.buildBuiltInExpression(StandardFilterOperators.LOWER_THAN, value);
  }
  public lt = this.lowerThan;

  public lowerEquals(value: number) {
    return this.buildBuiltInExpression(StandardFilterOperators.LOWER_EQUALS, value);
  }
  public le = this.lowerEquals;

  public greaterThan(value: number) {
    return this.buildBuiltInExpression(StandardFilterOperators.GREATER_THAN, value);
  }
  public gt = this.greaterThan;

  public greaterEquals(value: number) {
    return this.buildBuiltInExpression(StandardFilterOperators.GREATER_EQUALS, value);
  }
  public ge = this.greaterEquals;

  public in(...values: Array<number>) {
    return values.reduce((expression, value) => {
      const expr = this.buildBuiltInExpression(StandardFilterOperators.EQUALS, value);
      return expression ? expression.or(expr) : expr;
    }, null as unknown as QFilterExpression);
  }

  public plus(value: number) {
    return new QNumberPath(this.buildBuiltInOp(NumberFilterOperators.ADDITION, value));
  }
  public add = this.plus;

  public minus(value: number) {
    return new QNumberPath(this.buildBuiltInOp(NumberFilterOperators.SUBTRACTION, value));
  }
  public sub = this.minus;

  public multiply(value: number) {
    return new QNumberPath(this.buildBuiltInOp(NumberFilterOperators.MULTIPLICATION, value));
  }
  public mul = this.multiply;

  public divide(value: number) {
    return new QNumberPath(this.buildBuiltInOp(NumberFilterOperators.DIVISION, value));
  }
  public div = this.divide;

  public divideWithFraction(value: number) {
    return new QNumberPath(this.buildBuiltInOp(NumberFilterOperators.DIVISION_WITH_FRACTION, value));
  }
  public divBy = this.divideWithFraction;

  public modulo(value: number) {
    return new QNumberPath(this.buildBuiltInOp(NumberFilterOperators.MODULO, value));
  }
  public mod = this.modulo;

  public ceiling() {
    return new QNumberPath(this.buildNoValueFunc(NumberFilterFunctions.CEILING));
  }
  public floor() {
    return new QNumberPath(this.buildNoValueFunc(NumberFilterFunctions.FLOOR));
  }
  public round() {
    return new QNumberPath(this.buildNoValueFunc(NumberFilterFunctions.ROUND));
  }
}
