import { StandardFilterOperators } from "../../odata/ODataModel";
import { buildQFilterOperation } from "../../param/UrlParamHelper";
import { QFilterExpression } from "../../QFilterExpression";
import { QOrderByExpression } from "../../QOrderByExpression";

export type MapValue<T> = (value: T) => string;

export function orderAscending(path: string) {
  /**
   * Order by this property in ascending order.
   *
   * @returns orderby expression
   */
  return () => new QOrderByExpression(`${path} asc`);
}

export function orderDescending(path: string) {
  /**
   * Order by this property in descending order.
   *
   * @returns orderby expression
   */
  return () => new QOrderByExpression(`${path} desc`);
}

export function filterIsNull(path: string) {
  /**
   * Base filter function: property must be null.
   */
  return () => new QFilterExpression(`${path} eq null`);
}

export function filterIsNotNull(path: string) {
  /**
   * Base filter function: property must not be null.
   */
  return () => new QFilterExpression(`${path} ne null`);
}

export function filterEquals<T>(path: string, mapValue: MapValue<T>) {
  /**
   * Base filter function: property must equal the given value.
   */
  return (value: T | null) => {
    const result = value === null ? "null" : mapValue(value);
    return buildQFilterOperation(path, StandardFilterOperators.EQUALS, result);
  };
}

export function filterNotEquals<T>(path: string, mapValue: MapValue<T>) {
  /**
   * Base filter function: property must not equal the given value.
   */
  return (value: T | null) => {
    const result = value === null ? "null" : mapValue(value);
    return buildQFilterOperation(path, StandardFilterOperators.NOT_EQUALS, result);
  };
}

export function filterLowerThan<T>(path: string, mapValue: MapValue<T>) {
  /**
   * Base filter function: property must be lower than the given value.
   */
  return (value: T) => {
    return buildQFilterOperation(path, StandardFilterOperators.LOWER_THAN, mapValue(value));
  };
}

export function filterLowerEquals<T>(path: string, mapValue: MapValue<T>) {
  /**
   * Base filter function: property must be lower than or equal to the given value.
   */
  return (value: T) => {
    return buildQFilterOperation(path, StandardFilterOperators.LOWER_EQUALS, mapValue(value));
  };
}

export function filterGreaterThan<T>(path: string, mapValue: MapValue<T>) {
  /**
   * Base filter function: property must be greater than the given value.
   */
  return (value: T) => {
    return buildQFilterOperation(path, StandardFilterOperators.GREATER_THAN, mapValue(value));
  };
}

export function filterGreaterEquals<T>(path: string, mapValue: MapValue<T>) {
  /**
   * Base filter function: property must be greater than or equal to the given value.
   */
  return (value: T) => {
    return buildQFilterOperation(path, StandardFilterOperators.GREATER_EQUALS, mapValue(value));
  };
}

export function filterInEmulated<T>(path: string, mapValue: MapValue<T>) {
  /**
   * Base filter function: property must equal one of the given values.
   *
   * The in-statement is actually emulated by using an or-concatenation of equals-statements.
   */
  return (...values: Array<T>) => {
    return values.reduce(
      (expression, value) => {
        const expr = buildQFilterOperation(path, StandardFilterOperators.EQUALS, mapValue(value));
        return expression ? expression.or(expr) : expr;
      },
      null as unknown as QFilterExpression,
    );
  };
}

export function filterIn<T>(path: string, mapValue: MapValue<T>) {
  /**
   * Base filter function (V4): property must equal one of the given values.
   *
   * This implementation uses the native in-statement which is available since V4, but not implemented by
   * all V4 OData services.
   */
  return (...values: Array<T>) => {
    return buildQFilterOperation(path, StandardFilterOperators.IN, `(${values.map(mapValue).join(",")})`);
  };
}
