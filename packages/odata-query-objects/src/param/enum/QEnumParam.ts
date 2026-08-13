import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";
import { StringEnumLike, StringEnumMember } from "../../enum/EnumModel";
import { formatLiteralOrQuoted, parseLiteralOrQuoted } from "../UrlParamHelper";
import { UrlValueModel } from "../UrlParamModel";
import { BaseEnumParam } from "./BaseEnumParam";

/**
 * Param for a string enum.
 *
 * Without a converter the member is the wire value, as a declared enum's member always is. With one the
 * members are symbolic names the service never sees - see {@link QEnumPath} - and the value behind a name
 * decides the literal form, since it is a value of the annotated property's own type.
 */
export class QEnumParam<EnumType extends StringEnumLike, WireType = string> extends BaseEnumParam<
  StringEnumMember<EnumType>,
  WireType
> {
  public constructor(
    name: string,
    mappedName?: string,
    public readonly converter?: ValueConverter<WireType, StringEnumMember<EnumType>>,
  ) {
    super(name, mappedName);
  }

  protected mapValue(value: WireType): StringEnumMember<EnumType> {
    return this.converter ? this.converter.convertFrom(value)! : (value as StringEnumMember<EnumType>);
  }

  protected mapValueBack(value: StringEnumMember<EnumType>): WireType {
    return this.converter ? this.converter.convertTo(value)! : (value as WireType);
  }

  protected override formatWireValue(value: ParamValueModel<WireType>): UrlValueModel {
    return this.converter ? formatLiteralOrQuoted(value as ParamValueModel<any>) : super.formatWireValue(value);
  }

  protected override parseWireValue(value: UrlValueModel): ParamValueModel<WireType> {
    return this.converter ? (parseLiteralOrQuoted(value) as ParamValueModel<WireType>) : super.parseWireValue(value);
  }
}
