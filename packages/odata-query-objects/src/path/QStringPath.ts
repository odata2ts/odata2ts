import { QOrderByExpression } from "./../QOrderByExpression";
import { StandardFilterOperators, StringFilterFunctions } from "../odata/ODataModel";
import { QPathModel } from "./QPathModel";
import { QNumberPath } from "./QNumberPath";
import { QFilterExpression } from "../QFilterExpression";

export class QStringPath implements QPathModel {
  constructor(private path: string) {
    if (!path || !path.trim()) {
      throw Error("Path must be supplied!");
    }
  }

  /**
   * Get the path to this property.
   *
   * @returns this property path
   */
  public getPath(): string {
    return this.path;
  }

  public withPath(newPath: string): QStringPath {
    return new QStringPath(newPath);
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

  private getFinalValue(value: string | QStringPath) {
    return typeof value === "string" ? `'${value}'` : typeof value.getPath === "function" ? value.getPath() : "null";
  }

  private buildBuiltInOp(operator: StandardFilterOperators, value: string | QStringPath) {
    return new QFilterExpression(`${this.path} ${operator} ${this.getFinalValue(value)}`);
  }

  private buildFunc(func: StringFilterFunctions, value: string | QStringPath) {
    return new QFilterExpression(`${func}(${this.path},${this.getFinalValue(value)})`);
  }

  private buildNoValueFunc(func: StringFilterFunctions) {
    return new QStringPath(`${func}(${this.path})`);
  }

  public isNull() {
    return new QFilterExpression(`${this.path} eq null`);
  }

  public isNotNull() {
    return new QFilterExpression(`${this.path} ne null`);
  }

  public equals(value: string | null | QStringPath) {
    if (value === null) {
      return this.isNull();
    }
    return this.buildBuiltInOp(StandardFilterOperators.EQUALS, value);
  }
  public eq = this.equals;

  public notEquals(value: string | null | QStringPath) {
    if (value === null) {
      return this.isNotNull();
    }
    return this.buildBuiltInOp(StandardFilterOperators.NOT_EQUALS, value);
  }
  public ne = this.notEquals;

  public lowerThan(value: string | QStringPath) {
    return this.buildBuiltInOp(StandardFilterOperators.LOWER_THAN, value);
  }
  public lt = this.lowerThan;

  public lowerEquals(value: string | QStringPath) {
    return this.buildBuiltInOp(StandardFilterOperators.LOWER_EQUALS, value);
  }
  public le = this.lowerEquals;

  public greaterThan(value: string | QStringPath) {
    return this.buildBuiltInOp(StandardFilterOperators.GREATER_THAN, value);
  }
  public gt = this.greaterThan;

  public greaterEquals(value: string | QStringPath) {
    return this.buildBuiltInOp(StandardFilterOperators.GREATER_EQUALS, value);
  }
  public ge = this.greaterEquals;

  public in(...values: Array<string | QStringPath>) {
    return values.reduce((expression, value) => {
      const expr = this.buildBuiltInOp(StandardFilterOperators.EQUALS, value);
      return expression ? expression.or(expr) : expr;
    }, null as unknown as QFilterExpression);
  }

  public concatPrefix(value: string | QStringPath) {
    return new QStringPath(`${StringFilterFunctions.CONCAT}(${this.getFinalValue(value)},${this.path})`);
  }

  public concatSuffix(value: string | QStringPath) {
    return new QStringPath(`${StringFilterFunctions.CONCAT}(${this.path},${this.getFinalValue(value)})`);
  }

  public contains(value: string | QStringPath) {
    return this.buildFunc(StringFilterFunctions.CONTAINS, value);
  }

  public startsWith(value: string | QStringPath) {
    return this.buildFunc(StringFilterFunctions.STARTS_WITH, value);
  }

  public endsWith(value: string | QStringPath) {
    return this.buildFunc(StringFilterFunctions.ENDS_WITH, value);
  }

  public matchesPattern(value: string | QStringPath) {
    return this.buildFunc(StringFilterFunctions.MATCHES_PATTERN, value);
  }

  public indexOf(value: string | QStringPath) {
    const pathExpression = this.buildFunc(StringFilterFunctions.INDEX_OF, value);
    return new QNumberPath(pathExpression.toString());
  }

  public length() {
    const pathExpression = this.buildNoValueFunc(StringFilterFunctions.LENGTH);
    return new QNumberPath(pathExpression.getPath());
  }

  public toLower() {
    return this.buildNoValueFunc(StringFilterFunctions.TO_LOWER);
  }

  public toUpper() {
    return this.buildNoValueFunc(StringFilterFunctions.TO_UPPER);
  }

  public trim() {
    return this.buildNoValueFunc(StringFilterFunctions.TRIM);
  }
}
