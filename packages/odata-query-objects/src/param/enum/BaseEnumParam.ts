import { ParamValueModel } from "@odata2ts/converter-api";
import { FlexibleConversionModel, QParamModel } from "../QParamModel";
import { formatParamWithQuotes, parseWithQuotes } from "../UrlParamHelper";

export abstract class BaseEnumParam<EnumParam> implements QParamModel<string, EnumParam> {
  public constructor(
    protected name: string,
    protected mappedName?: string,
  ) {
    if (!name) {
      throw new Error("Name is required for QParam objects!");
    }
  }

  protected abstract mapValue(value: string): EnumParam;
  protected abstract mapValueBack(value: EnumParam): string;

  public getName() {
    return this.name;
  }

  public getMappedName() {
    return this.mappedName ?? this.getName();
  }

  public convertFrom(value: FlexibleConversionModel<string>): FlexibleConversionModel<EnumParam> {
    return Array.isArray(value)
      ? value.map((v) => (v === null || v === undefined ? v : this.mapValue(v)))
      : value === null || value === undefined
        ? value
        : this.mapValue(value);
  }

  public convertTo(value: FlexibleConversionModel<EnumParam>): FlexibleConversionModel<string> {
    if (value === null) {
      return null;
    }
    if (value === undefined) {
      return undefined;
    }

    return Array.isArray(value)
      ? value.map((v) => (v === null || v === undefined ? undefined : this.mapValueBack(v)))
      : this.mapValueBack(value);
  }

  public formatUrlValue(value: FlexibleConversionModel<EnumParam>): string | undefined {
    return Array.isArray(value)
      ? JSON.stringify(this.convertTo(value))
      : formatParamWithQuotes(this.convertTo(value) as ParamValueModel<any>);
  }

  public parseUrlValue(value: string | undefined): FlexibleConversionModel<EnumParam> {
    const parsed = parseWithQuotes(value);
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
