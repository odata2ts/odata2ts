import { StandardFilterOperators, StringFilterFunctions } from "./ODataModel";
import { QNumberPath } from "./QNumberPath";

export class QStringPath {
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

  private buildBuiltInOp(operator: StandardFilterOperators, value: string) {
    return `${this.getPathExpression()} ${operator} '${value}'`;
  }

  private buildFunc(func: StringFilterFunctions, value: string) {
    return `${func}(${this.getPathExpression()},'${value}')`;
  }

  private buildNoValueFunc(func: StringFilterFunctions) {
    return `${func}(${this.getPathExpression()})`;
  }

  public equals(value: string) {
    const result = this.buildBuiltInOp(StandardFilterOperators.EQUALS, value);
    this.pathExpression = undefined;
    return result;
  }
  public eq = this.equals;

  public notEquals(value: string) {
    const result = this.buildBuiltInOp(StandardFilterOperators.NOT_EQUALS, value);
    this.pathExpression = undefined;
    return result;
  }
  public ne = this.notEquals;

  public lowerThan(value: string) {
    const result = this.buildBuiltInOp(StandardFilterOperators.LOWER_THAN, value);
    this.pathExpression = undefined;
    return result;
  }
  public lt = this.lowerThan;

  public lowerEquals(value: string) {
    const result = this.buildBuiltInOp(StandardFilterOperators.LOWER_EQUALS, value);
    this.pathExpression = undefined;
    return result;
  }
  public le = this.lowerEquals;

  public greaterThan(value: string) {
    const result = this.buildBuiltInOp(StandardFilterOperators.GREATER_THAN, value);
    this.pathExpression = undefined;
    return result;
  }
  public gt = this.greaterThan;

  public greaterEquals(value: string) {
    const result = this.buildBuiltInOp(StandardFilterOperators.GREATER_EQUALS, value);
    this.pathExpression = undefined;
    return result;
  }
  public ge = this.greaterEquals;

  public concatPrefix(value: string) {
    this.pathExpression = `${StringFilterFunctions.CONCAT}('${value}',${this.getPathExpression()})`;
    return this;
  }

  public concatSuffix(value: string) {
    this.pathExpression = `${StringFilterFunctions.CONCAT}(${this.getPathExpression()},'${value}')`;
    return this;
  }

  public contains(value: string) {
    const result = this.buildFunc(StringFilterFunctions.CONTAINS, value);
    this.pathExpression = undefined;
    return result;
  }

  public startsWith(value: string) {
    const result = this.buildFunc(StringFilterFunctions.STARTS_WITH, value);
    this.pathExpression = undefined;
    return result;
  }

  public endsWith(value: string) {
    const result = this.buildFunc(StringFilterFunctions.ENDS_WITH, value);
    this.pathExpression = undefined;
    return result;
  }

  public matchesPattern(value: string) {
    const result = this.buildFunc(StringFilterFunctions.MATCHES_PATTERN, value);
    this.pathExpression = undefined;
    return result;
  }

  public indexOf(value: string) {
    const pathExpression = this.buildFunc(StringFilterFunctions.INDEX_OF, value);
    return this;
  }

  public length() {
    const pathExpression = this.buildNoValueFunc(StringFilterFunctions.LENGTH);
    return this;
  }

  public toLower() {
    this.pathExpression = this.buildNoValueFunc(StringFilterFunctions.TO_LOWER);
    return this;
  }

  public toUpper() {
    this.pathExpression = this.buildNoValueFunc(StringFilterFunctions.TO_UPPER);
    return this;
  }

  public trim() {
    this.pathExpression = this.buildNoValueFunc(StringFilterFunctions.TRIM);
    return this;
  }
}
