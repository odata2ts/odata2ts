import { ParamValueModel } from "@odata2ts/converter-api";
import { FlexibleConversionModel } from "../../QueryObjectModel";
import { QParamModel } from "../QParamModel";
import { formatParamWithQuotes, parseWithQuotes } from "../UrlParamHelper";
import { UrlValueModel } from "../UrlParamModel";

export abstract class BaseEnumParam<EnumParam, WireType = string> implements QParamModel<WireType, EnumParam> {
  public constructor(
    protected name: string,
    protected mappedName?: string,
  ) {
    if (!name) {
      throw new Error("Name is required for QParam objects!");
    }
  }

  protected abstract mapValue(value: WireType): EnumParam;
  protected abstract mapValueBack(value: EnumParam): WireType;

  /**
   * The literal form a wire value takes in a URL. An enum member goes there quoted, which is why this is
   * the default - an enumeration the service never declared is the case where it is not, see
   * {@link QEnumParam}.
   */
  protected formatWireValue(value: ParamValueModel<WireType>): UrlValueModel {
    return formatParamWithQuotes(value as ParamValueModel<any>);
  }

  protected parseWireValue(value: UrlValueModel): ParamValueModel<WireType> {
    return parseWithQuotes(value) as ParamValueModel<WireType>;
  }

  public getName() {
    return this.name;
  }

  public getMappedName() {
    return this.mappedName ?? this.getName();
  }

  public convertFrom(value: FlexibleConversionModel<WireType>): FlexibleConversionModel<EnumParam> {
    return Array.isArray(value)
      ? value.map((v) =>
          v === null || v === undefined ? (v as ParamValueModel<EnumParam>) : this.mapValue(v as WireType),
        )
      : value === null || value === undefined
        ? (value as ParamValueModel<EnumParam>)
        : this.mapValue(value as WireType);
  }

  public convertTo(value: FlexibleConversionModel<EnumParam>): FlexibleConversionModel<WireType> {
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
      : this.formatWireValue(this.convertTo(value) as ParamValueModel<WireType>);
  }

  public parseUrlValue(value: string | undefined): FlexibleConversionModel<EnumParam> {
    const parsed = this.parseWireValue(value);
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
