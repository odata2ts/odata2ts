import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";

import { getIdentityConverter } from "../IdentityConverter";
import { QParamModel } from "./QParamModel";
import { UrlParamValueFormatter, UrlParamValueParser } from "./UrlParamModel";

export type PrimitiveParamType = string | number | boolean;

export abstract class QParam<Type extends PrimitiveParamType, ConvertedType>
  implements QParamModel<Type, ConvertedType>
{
  constructor(
    protected name: string,
    protected mappedName?: string,
    protected readonly converter: ValueConverter<Type, ConvertedType> = getIdentityConverter<Type, ConvertedType>()
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

  public convertFrom(value: ParamValueModel<Type>): ParamValueModel<ConvertedType>;
  public convertFrom(value: Array<ParamValueModel<Type>>): Array<ParamValueModel<ConvertedType>>;
  public convertFrom(value: ParamValueModel<Type> | Array<ParamValueModel<Type>>) {
    return Array.isArray(value) ? value.map(this.converter.convertFrom) : this.converter.convertFrom(value);
  }

  public convertTo(value: ParamValueModel<ConvertedType>): ParamValueModel<Type>;
  public convertTo(value: Array<ParamValueModel<ConvertedType>>): Array<ParamValueModel<Type>>;
  public convertTo(value: ParamValueModel<ConvertedType> | Array<ParamValueModel<ConvertedType>>) {
    return Array.isArray(value) ? value.map(this.converter.convertTo) : this.converter.convertTo(value);
  }

  public formatUrlValue(
    value: ParamValueModel<ConvertedType> | Array<ParamValueModel<ConvertedType>>
  ): string | undefined {
    return Array.isArray(value)
      ? JSON.stringify(this.convertTo(value))
      : this.getUrlConformValue(this.convertTo(value));
  }

  public parseUrlValue(
    value: string | undefined
  ): ParamValueModel<ConvertedType> | Array<ParamValueModel<ConvertedType>> {
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
