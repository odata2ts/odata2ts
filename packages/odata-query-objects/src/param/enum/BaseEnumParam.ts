import { ParamValueModel } from "@odata2ts/converter-api";
import { QParamModel } from "../QParamModel";
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

  public convertFrom(value: ParamValueModel<string>): ParamValueModel<EnumParam>;
  public convertFrom(value: Array<ParamValueModel<string>>): Array<ParamValueModel<EnumParam>>;
  public convertFrom(value: ParamValueModel<string> | Array<ParamValueModel<string>>) {
    return Array.isArray(value)
      ? value.map((v) => (v === null || v === undefined ? v : this.mapValue(v)))
      : value === null || value === undefined
        ? value
        : this.mapValue(value);
  }

  public convertTo(value: ParamValueModel<EnumParam>): ParamValueModel<string>;
  public convertTo(value: Array<ParamValueModel<EnumParam>>): Array<ParamValueModel<string>>;
  public convertTo(value: ParamValueModel<EnumParam> | Array<ParamValueModel<EnumParam>>) {
    return Array.isArray(value)
      ? value.map((v) => (v === null || v === undefined ? v : this.mapValueBack(v)))
      : value === null || value === undefined
        ? value
        : this.mapValueBack(value);
  }

  public formatUrlValue(value: ParamValueModel<EnumParam> | Array<ParamValueModel<EnumParam>>): string | undefined {
    return Array.isArray(value) ? JSON.stringify(this.convertTo(value)) : formatParamWithQuotes(this.convertTo(value));
  }

  public parseUrlValue(value: string | undefined): ParamValueModel<EnumParam> | Array<ParamValueModel<EnumParam>> {
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
