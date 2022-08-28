import { QOrderByExpression } from "../../QOrderByExpression";
import { QFilterExpression } from "../../QFilterExpression";
import { QPathModel } from "../QPathModel";
import { getExpressionValue } from "../../param/UrlParamHelper";

export abstract class QLiteralPath<ValueType extends boolean | number | string | QPathModel, OperatorTypes>
  implements QPathModel
{
  constructor(protected path: string) {
    if (!path || !path.trim()) {
      throw new Error("Path must be supplied!");
    }
  }

  protected buildBuiltInExpression(operator: OperatorTypes, value: ValueType) {
    return new QFilterExpression(this.buildBuiltInOp(operator, value));
  }

  protected buildBuiltInOp(operator: OperatorTypes, value: ValueType) {
    return `${this.path} ${operator} ${getExpressionValue(value)}`;
  }

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

  public isNull() {
    return `${this.path} eq null`;
  }

  public isNotNull() {
    return `${this.path} ne null`;
  }
}
