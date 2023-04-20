import { ValueConverter } from "@odata2ts/converter-api";

import { getIdentityConverter } from "../../IdentityConverter";
import { StandardFilterOperators } from "../../odata/ODataModel";
import { buildQFilterOperation, isPathValue } from "../../param/UrlParamHelper";
import { UrlExpressionValueModel } from "../../param/UrlParamModel";
import { QFilterExpression } from "../../QFilterExpression";
import { QOrderByExpression } from "../../QOrderByExpression";
import { QValuePathModel } from "../QPathModel";

export type ExtractConverted<T> = T extends ValueConverter<any, infer Converted> ? Converted : never;
export type InputModel<T> = QValuePathModel | ExtractConverted<T>;

export abstract class QBasePath<ValueType extends UrlExpressionValueModel, ConvertedType> implements QValuePathModel {
  protected abstract formatValue(value: ValueType): string;

  public constructor(
    protected path: string,
    public readonly converter: ValueConverter<ValueType, ConvertedType> = getIdentityConverter<
      ValueType,
      ConvertedType
    >()
  ) {
    if (!path || !path.trim()) {
      throw new Error("Path must be supplied!");
    }
  }

  protected convertInput(value: InputModel<this["converter"]>): string {
    if (isPathValue(value)) {
      return value.getPath();
    }

    const converted = this.converter.convertTo(value);
    if (converted === null || converted === undefined) {
      throw new Error(`Value "${value}" converted to ${converted}!`);
    }

    return this.formatValue(converted);
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

  public equals = (value: InputModel<this["converter"]> | null) => {
    const result = value === null ? "null" : this.convertInput(value);
    return buildQFilterOperation(this.path, StandardFilterOperators.EQUALS, result);
  };
  public eq = this.equals;

  public notEquals = (value: InputModel<this["converter"]> | null) => {
    const result = value === null ? "null" : this.convertInput(value);
    return buildQFilterOperation(this.path, StandardFilterOperators.NOT_EQUALS, result);
  };
  public ne = this.notEquals;

  public lowerThan = (value: InputModel<this["converter"]>) => {
    return buildQFilterOperation(this.path, StandardFilterOperators.LOWER_THAN, this.convertInput(value));
  };
  public lt = this.lowerThan;

  public lowerEquals = (value: InputModel<this["converter"]>) => {
    return buildQFilterOperation(this.path, StandardFilterOperators.LOWER_EQUALS, this.convertInput(value));
  };
  public le = this.lowerEquals;

  public greaterThan = (value: InputModel<this["converter"]>) => {
    return buildQFilterOperation(this.path, StandardFilterOperators.GREATER_THAN, this.convertInput(value));
  };
  public gt = this.greaterThan;

  public greaterEquals = (value: InputModel<this["converter"]>) => {
    return buildQFilterOperation(this.path, StandardFilterOperators.GREATER_EQUALS, this.convertInput(value));
  };
  public ge = this.greaterEquals;

  public in = (...values: Array<InputModel<this["converter"]>>) => {
    return values.reduce((expression, value) => {
      const expr = buildQFilterOperation(this.path, StandardFilterOperators.EQUALS, this.convertInput(value));
      return expression ? expression.or(expr) : expr;
    }, null as unknown as QFilterExpression);
  };
}
