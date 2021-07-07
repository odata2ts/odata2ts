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

  public getPath(): string {
    return this.path;
  }

  private buildBuiltInOp(operator: StandardFilterOperators, value: string) {
    return new QFilterExpression(`${this.path} ${operator} '${value}'`);
  }

  private buildFunc(func: StringFilterFunctions, value: string) {
    return new QFilterExpression(`${func}(${this.path},'${value}')`);
  }

  private buildNoValueFunc(func: StringFilterFunctions) {
    return new QStringPath(`${func}(${this.path})`);
  }

  public equals(value: string) {
    return this.buildBuiltInOp(StandardFilterOperators.EQUALS, value);
  }
  public eq = this.equals;

  public notEquals(value: string) {
    return this.buildBuiltInOp(StandardFilterOperators.NOT_EQUALS, value);
  }
  public ne = this.notEquals;

  public lowerThan(value: string) {
    return this.buildBuiltInOp(StandardFilterOperators.LOWER_THAN, value);
  }
  public lt = this.lowerThan;

  public lowerEquals(value: string) {
    return this.buildBuiltInOp(StandardFilterOperators.LOWER_EQUALS, value);
  }
  public le = this.lowerEquals;

  public greaterThan(value: string) {
    return this.buildBuiltInOp(StandardFilterOperators.GREATER_THAN, value);
  }
  public gt = this.greaterThan;

  public greaterEquals(value: string) {
    return this.buildBuiltInOp(StandardFilterOperators.GREATER_EQUALS, value);
  }
  public ge = this.greaterEquals;

  public in(...values: Array<string>) {
    return values.reduce((expression, value) => {
      const expr = this.buildBuiltInOp(StandardFilterOperators.EQUALS, value);
      return expression ? expression.or(expr) : expr;
    }, null as unknown as QFilterExpression);
  }

  public concatPrefix(value: string) {
    return new QStringPath(`${StringFilterFunctions.CONCAT}('${value}',${this.path})`);
  }

  public concatSuffix(value: string) {
    return new QStringPath(`${StringFilterFunctions.CONCAT}(${this.path},'${value}')`);
  }

  public contains(value: string) {
    return this.buildFunc(StringFilterFunctions.CONTAINS, value);
  }

  public startsWith(value: string) {
    return this.buildFunc(StringFilterFunctions.STARTS_WITH, value);
  }

  public endsWith(value: string) {
    return this.buildFunc(StringFilterFunctions.ENDS_WITH, value);
  }

  public matchesPattern(value: string) {
    return this.buildFunc(StringFilterFunctions.MATCHES_PATTERN, value);
  }

  public indexOf(value: string) {
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
