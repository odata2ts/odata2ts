import { ValueConverter } from "../../converter";
import { StandardFilterOperators } from "../../odata/ODataModel";
import { getExpressionValue } from "../../param/UrlParamHelper";
import { UrlExpressionValueModel, UrlParamModel } from "../../param/UrlParamModel";
import { QFilterExpression } from "../../QFilterExpression";

export class PathOperator<ValueType extends UrlExpressionValueModel, ConvertedType> {
  constructor(
    protected path: string,
    protected converter: ValueConverter<ValueType, ConvertedType>,
    protected options?: UrlParamModel
  ) {}

  private buildExpression(operator: StandardFilterOperators, value: ConvertedType) {
    const converted = this.converter.convertTo(value);
    if (converted === undefined) {
      throw new Error(`Value "${value}" converts to undefined!`);
    }

    const expression = `${this.path} ${operator} ${getExpressionValue(converted)}`;
    return new QFilterExpression(expression);
  }

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
