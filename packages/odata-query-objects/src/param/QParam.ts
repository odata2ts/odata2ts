import { ParamValueModel, ValueConverter, getIdentityConverter } from "@odata2ts/converter";

import { UrlParamValueFormatter, UrlParamValueParser } from "../internal";

export abstract class QParam<Type extends string | number | boolean, ConvertedType> {
  constructor(
    protected name: string,
    protected mappedName?: string,
    public readonly converter: ValueConverter<Type, ConvertedType> = getIdentityConverter<Type, ConvertedType>()
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

  public convertFrom(value: ParamValueModel<Type>): ParamValueModel<ConvertedType> {
    return this.converter.convertFrom(value);
  }

  public convertTo(value: ParamValueModel<ConvertedType>): ParamValueModel<Type> {
    return this.converter.convertTo(value);
  }

  public formatUrlValue(value: ParamValueModel<ConvertedType>): string | undefined {
    return this.getUrlConformValue(this.convertTo(value));
  }

  public parseUrlValue(value: string | undefined) {
    const parsed = this.parseValueFromUrl(value);
    return this.convertFrom(parsed);
  }
}
