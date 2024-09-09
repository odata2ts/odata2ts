import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";
import { getIdentityConverter } from "../IdentityConverter";
import { FlexibleConversionModel } from "../QueryObjectModel";
import { QParamModel } from "./QParamModel";
import { UrlParamValueFormatter, UrlParamValueParser } from "./UrlParamModel";

export type PrimitiveParamType = string | number | boolean;

export abstract class QParam<Type extends PrimitiveParamType, ConvertedType>
  implements QParamModel<Type, ConvertedType>
{
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

  public convertFrom(value: FlexibleConversionModel<Type>): FlexibleConversionModel<ConvertedType> {
    return Array.isArray(value) ? value.map(this.converter.convertFrom) : this.converter.convertFrom(value);
  }

  public convertTo(value: FlexibleConversionModel<ConvertedType>): FlexibleConversionModel<Type> {
    return Array.isArray(value) ? value.map(this.converter.convertTo) : this.converter.convertTo(value);
  }

  public formatUrlValue(value: FlexibleConversionModel<ConvertedType>): string | undefined {
    const converted = this.convertTo(value);
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
          return this.convertFrom(jsonParsed);
        }
      } catch (e) {}
    }
    return this.convertFrom(parsed);
  }
}
