import { ConverterOptions, ParamValueModel, ValueConverter } from "@odata2ts/converter-api";
import { getIdentityConverter } from "../IdentityConverter";
import { FlexibleConversionModel } from "../QueryObjectModel";
import { QParamModel } from "./QParamModel";
import { URL_CONVERSION_OPTIONS } from "./UrlParamHelper";
import { UrlParamValueFormatter, UrlParamValueParser } from "./UrlParamModel";

export type PrimitiveParamType = string | number | boolean;

export abstract class QParam<Type extends PrimitiveParamType, ConvertedType> implements QParamModel<
  Type,
  ConvertedType
> {
  constructor(
    protected name: string,
    protected mappedName?: string,
    protected readonly converter: ValueConverter<Type, ConvertedType> = getIdentityConverter<Type>() as ValueConverter<
      Type,
      ConvertedType
    >,
  ) {
    if (!name) {
      throw new Error("Name is required for QParam objects!");
    }
  }

  public getName() {
    return this.name;
  }

  public getMappedName() {
    return this.mappedName ?? this.getName();
  }

  public getConverter() {
    return this.converter;
  }

  protected abstract getUrlConformValue: UrlParamValueFormatter<Type>;
  protected abstract parseValueFromUrl: UrlParamValueParser<Type>;

  public convertFrom(
    value: FlexibleConversionModel<Type>,
    options?: ConverterOptions,
  ): FlexibleConversionModel<ConvertedType> {
    return Array.isArray(value)
      ? value.map((v) => this.converter.convertFrom(v, options))
      : this.converter.convertFrom(value, options);
  }

  public convertTo(
    value: FlexibleConversionModel<ConvertedType>,
    options?: ConverterOptions,
  ): FlexibleConversionModel<Type> {
    return Array.isArray(value)
      ? value.map((v) => this.converter.convertTo(v, options))
      : this.converter.convertTo(value, options);
  }

  public formatUrlValue(value: FlexibleConversionModel<ConvertedType>): string | undefined {
    // a param value ends up in the URL just like a path value does - entity keys and function
    // parameters both go there, so the converter has to be told, same as in QBasePath
    const converted = this.convertTo(value, URL_CONVERSION_OPTIONS);
    return Array.isArray(value)
      ? JSON.stringify(converted)
      : this.getUrlConformValue(converted as ParamValueModel<Type>);
  }

  public parseUrlValue(value: string | undefined): FlexibleConversionModel<ConvertedType> {
    const parsed = this.parseValueFromUrl(value);
    if (value && parsed === undefined) {
      try {
        const jsonParsed = JSON.parse(value);
        if (Array.isArray(jsonParsed)) {
          return this.convertFrom(jsonParsed, URL_CONVERSION_OPTIONS);
        }
      } catch (e) {}
    }
    return this.convertFrom(parsed, URL_CONVERSION_OPTIONS);
  }
}
