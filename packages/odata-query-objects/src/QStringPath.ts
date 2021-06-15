import { StandardFilterOperators, StringFilterFunctions } from "./ODataModel";

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

  public concatPrefix(value: string) {
    this.pathExpression = `${StringFilterFunctions.CONCAT}('${value}',${this.getPathExpression()})`;
    return this;
  }

  public concatSuffix(value: string) {
    this.pathExpression = `${StringFilterFunctions.CONCAT}(${this.getPathExpression()},'${value}')`;
    return this;
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
    return this;
  }

  public length() {
    this.pathExpression = this.buildNoValueFunc(StringFilterFunctions.LENGTH);
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
