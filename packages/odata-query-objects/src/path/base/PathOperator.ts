import { ValueConverter } from "../../converter";
import { StandardFilterOperators } from "../../odata/ODataModel";
import { getExpressionValue } from "../../param/UrlParamHelper";
import { ParamValueModel, UrlExpressionValueModel, UrlParamModel } from "../../param/UrlParamModel";
import { QFilterExpression } from "../../QFilterExpression";

export class PathOperator<ValueType extends UrlExpressionValueModel, ConvertedType> {
  constructor(
    protected path: string,
    protected options?: UrlParamModel,
    protected converter?: ValueConverter<ValueType, ConvertedType>
  ) {}

  private buildExpression(operator: StandardFilterOperators, value: ConvertedType) {
    return new QFilterExpression(this.buildOperation(operator, value));
  }

  private buildOperation(operator: StandardFilterOperators, value: ConvertedType) {
    const converted = this.converter
      ? this.converter.convertTo(value)
      : (value as unknown as ParamValueModel<ValueType>);
    if (converted === undefined) {
      throw new Error(`Value "${value}" converts to undefined!`);
    }

    return `${this.path} ${operator} ${getExpressionValue(converted)}`;
  }

  public equals = (value: ConvertedType) => {
    return this.buildExpression(StandardFilterOperators.EQUALS, value);
  };

  public notEquals = (value: ConvertedType) => {
    return this.buildExpression(StandardFilterOperators.NOT_EQUALS, value);
  };

  public lowerThan = (value: ConvertedType) => {
    return this.buildExpression(StandardFilterOperators.LOWER_THAN, value);
  };

  public lowerEquals = (value: ConvertedType) => {
    return this.buildExpression(StandardFilterOperators.LOWER_EQUALS, value);
  };

  public greaterThan = (value: ConvertedType) => {
    return this.buildExpression(StandardFilterOperators.GREATER_THAN, value);
  };

  public greaterEquals = (value: ConvertedType) => {
    return this.buildExpression(StandardFilterOperators.GREATER_EQUALS, value);
  };

  public in = (...values: Array<ConvertedType>) => {
    return values.reduce((expression, value) => {
      const expr = this.buildExpression(StandardFilterOperators.EQUALS, value);
      return expression ? expression.or(expr) : expr;
    }, null as unknown as QFilterExpression);
  };
}
