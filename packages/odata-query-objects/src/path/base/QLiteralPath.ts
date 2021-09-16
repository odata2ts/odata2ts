import { QOrderByExpression } from "../../QOrderByExpression";
import { QFilterExpression } from "../../QFilterExpression";
import { QPathModel } from "../QPathModel";

export abstract class QLiteralPath<ValueType, OperatorTypes> implements QPathModel {
  constructor(protected path: string) {
    if (!path || !path.trim()) {
      throw Error("Path must be supplied!");
    }
  }

  abstract withPath(newPath: string): any;

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

  protected buildBuiltInExpression(operator: OperatorTypes, value: ValueType) {
    return new QFilterExpression(this.buildBuiltInOp(operator, value));
  }

  protected buildBuiltInOp(operator: OperatorTypes, value: ValueType) {
    return `${this.path} ${operator} ${value}`;
  }
}
