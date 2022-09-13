import { ValueConverter } from "../../converter";
import { UrlExpressionValueModel, UrlParamModel } from "../../param/UrlParamModel";
import { QFilterExpression } from "../../QFilterExpression";
import { QOrderByExpression } from "../../QOrderByExpression";
import { PathOperator } from "./PathOperator";

export abstract class QBasePath<ValueType extends UrlExpressionValueModel, ConvertedType = ValueType> {
  protected pathOperator: PathOperator<ValueType, ConvertedType>;

  protected abstract getOptions(): UrlParamModel | undefined;

  public constructor(protected path: string, protected converter?: ValueConverter<ValueType, ConvertedType>) {
    if (!path || !path.trim()) {
      throw new Error("Path must be supplied!");
    }

    this.pathOperator = new PathOperator<ValueType, ConvertedType>(path, this.getOptions(), converter);
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
    return new QFilterExpression(`${this.path} eq null`);
  }

  public isNotNull() {
    return new QFilterExpression(`${this.path} ne null`);
  }
}
