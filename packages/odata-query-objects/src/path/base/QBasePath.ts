import { ConverterOptions, ValueConverter } from "@odata2ts/converter-api";
import { getIdentityConverter } from "../../IdentityConverter";
import { isPathValue } from "../../param/UrlParamHelper";
import { UrlExpressionValueModel } from "../../param/UrlParamModel";
import { QValuePathModel } from "../QPathModel";
import {
  filterEquals,
  filterGreaterEquals,
  filterGreaterThan,
  filterIn,
  filterInEmulated,
  filterIsNotNull,
  filterIsNull,
  filterLowerEquals,
  filterLowerThan,
  filterNotEquals,
  orderAscending,
  orderDescending,
} from "./BaseFunctions";

export type ExtractConverted<T> = T extends ValueConverter<any, infer Converted> ? Converted : never;
export type InputModel<T> = QValuePathModel | ExtractConverted<T>;

const CONVERSION_OPTIONS: ConverterOptions = { urlConversion: true };

export abstract class QBasePath<ValueType extends UrlExpressionValueModel, ConvertedType> implements QValuePathModel {
  protected abstract formatValue(value: ValueType): string;

  public constructor(
    protected path: string,
    public readonly converter: ValueConverter<
      ValueType,
      ConvertedType
    > = getIdentityConverter<ValueType>() as ValueConverter<ValueType, ConvertedType>,
    public readonly options: { nativeIn: boolean } = { nativeIn: false },
  ) {
    if (!path || !path.trim()) {
      throw new Error("Path must be supplied!");
    }
  }

  protected convertInput = (value: InputModel<this["converter"]>): string => {
    if (isPathValue(value)) {
      return value.getPath();
    }

    const converted = this.converter.convertTo(value, CONVERSION_OPTIONS);
    if (converted === null || converted === undefined) {
      throw new Error(`Value "${value}" converted to ${converted}!`);
    }

    return this.formatValue(converted);
  };

  /**
   * Get the path to this property.
   *
   * @returns this property path
   */
  public getPath(): string {
    return this.path;
  }

  public ascending = orderAscending(this.path);
  public asc = this.ascending;
  public descending = orderDescending(this.path);
  public desc = this.descending;

  public isNull = filterIsNull(this.path);
  public isNotNull = filterIsNotNull(this.path);
  public equals = filterEquals<InputModel<this["converter"]>>(this.path, this.convertInput);
  public eq = this.equals;
  public notEquals = filterNotEquals<InputModel<this["converter"]>>(this.path, this.convertInput);
  public ne = this.notEquals;

  public lowerThan = filterLowerThan<InputModel<this["converter"]>>(this.path, this.convertInput);
  public lt = this.lowerThan;
  public lowerEquals = filterLowerEquals<InputModel<this["converter"]>>(this.path, this.convertInput);
  public le = this.lowerEquals;
  public greaterThan = filterGreaterThan<InputModel<this["converter"]>>(this.path, this.convertInput);
  public gt = this.greaterThan;
  public greaterEquals = filterGreaterEquals<InputModel<this["converter"]>>(this.path, this.convertInput);
  public ge = this.greaterEquals;
  public in = this.options.nativeIn
    ? filterIn<InputModel<this["converter"]>>(this.path, this.convertInput)
    : filterInEmulated<InputModel<this["converter"]>>(this.path, this.convertInput);
}
