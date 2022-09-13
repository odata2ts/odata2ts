import { ValueConverter } from "../converter/ConverterModel";
import { UrlParamValueFormatter, UrlParamValueParser } from "../internal";
import { ParamValueModel } from "./UrlParamModel";

export abstract class QParam<Type extends string | number | boolean, ConvertedType = Type>
  implements ValueConverter<Type, ConvertedType>
{
  constructor(
    protected name: string,
    protected mappedName?: string,
    protected converter?: ValueConverter<Type, ConvertedType>
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

  public formatUrlValue(value: ParamValueModel<ConvertedType>): string | undefined {
    const result: ParamValueModel<Type> = this.converter ? this.converter.convertTo(value) : (value as unknown as Type);
    return this.getUrlConformValue(result);
  }

  public parseUrlValue(value: string | undefined) {
    const parsed = this.parseValueFromUrl(value);
    return this.convertFrom(parsed);
  }

  public convertFrom(value: ParamValueModel<Type>): ParamValueModel<ConvertedType> {
    return this.converter ? this.converter.convertFrom(value) : (value as unknown as ParamValueModel<ConvertedType>);
  }

  public convertTo(value: ParamValueModel<ConvertedType>): ParamValueModel<Type> {
    return this.converter ? this.converter.convertTo(value) : (value as unknown as ParamValueModel<Type>);
  }
}
