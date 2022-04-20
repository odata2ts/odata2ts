import { QOrderByExpression } from "../../QOrderByExpression";
import { StandardFilterOperators, StringFilterFunctions } from "../../odata/ODataModel";
import { QPathModel } from "../QPathModel";
import { QNumberPath } from "../QNumberPath";
import { QFilterExpression } from "../../QFilterExpression";

export abstract class QStringBasePath<SubClass extends QStringBasePath<any>> implements QPathModel {
  constructor(private path: string) {
    if (!path || !path.trim()) {
      throw Error("Path must be supplied!");
    }
  }

  protected abstract create(path: string): SubClass;

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

  protected getFinalValue(value: string | SubClass) {
    return typeof value === "string" ? `'${value}'` : typeof value.getPath === "function" ? value.getPath() : "null";
  }

  protected buildBuiltInOp(operator: StandardFilterOperators, value: string | SubClass) {
    return new QFilterExpression(`${this.path} ${operator} ${this.getFinalValue(value)}`);
  }

  protected buildFunc(func: StringFilterFunctions, value: string | SubClass) {
    return new QFilterExpression(`${func}(${this.path},${this.getFinalValue(value)})`);
  }

  protected buildNoValueFunc(func: StringFilterFunctions) {
    return this.create(`${func}(${this.path})`);
  }

  public isNull() {
    return new QFilterExpression(`${this.path} eq null`);
  }

  public isNotNull() {
    return new QFilterExpression(`${this.path} ne null`);
  }

  public equals(value: string | null | SubClass) {
    if (value === null) {
      return this.isNull();
    }
    return this.buildBuiltInOp(StandardFilterOperators.EQUALS, value);
  }
  public eq = this.equals;

  public notEquals(value: string | null | SubClass) {
    if (value === null) {
      return this.isNotNull();
    }
    return this.buildBuiltInOp(StandardFilterOperators.NOT_EQUALS, value);
  }
  public ne = this.notEquals;

  public lowerThan(value: string | SubClass) {
    return this.buildBuiltInOp(StandardFilterOperators.LOWER_THAN, value);
  }
  public lt = this.lowerThan;

  public lowerEquals(value: string | SubClass) {
    return this.buildBuiltInOp(StandardFilterOperators.LOWER_EQUALS, value);
  }
  public le = this.lowerEquals;

  public greaterThan(value: string | SubClass) {
    return this.buildBuiltInOp(StandardFilterOperators.GREATER_THAN, value);
  }
  public gt = this.greaterThan;

  public greaterEquals(value: string | SubClass) {
    return this.buildBuiltInOp(StandardFilterOperators.GREATER_EQUALS, value);
  }
  public ge = this.greaterEquals;

  public in(...values: Array<string | SubClass>) {
    return values.reduce((expression, value) => {
      const expr = this.buildBuiltInOp(StandardFilterOperators.EQUALS, value);
      return expression ? expression.or(expr) : expr;
    }, null as unknown as QFilterExpression);
  }

  public concatPrefix(value: string | SubClass) {
    return this.create(`${StringFilterFunctions.CONCAT}(${this.getFinalValue(value)},${this.path})`);
  }

  public concatSuffix(value: string | SubClass) {
    return this.create(`${StringFilterFunctions.CONCAT}(${this.path},${this.getFinalValue(value)})`);
  }

  public startsWith(value: string | SubClass) {
    return this.buildFunc(StringFilterFunctions.STARTS_WITH, value);
  }

  public endsWith(value: string | SubClass) {
    return this.buildFunc(StringFilterFunctions.ENDS_WITH, value);
  }

  public indexOf(value: string | SubClass) {
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
