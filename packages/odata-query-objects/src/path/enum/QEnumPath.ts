import { ValueConverter } from "@odata2ts/converter-api";
import { StringEnumSource, StringEnumSourceMember } from "../../enum/EnumModel";
import { formatLiteral, formatWithQuotes, URL_CONVERSION_OPTIONS } from "../../param/UrlParamHelper";
import { BaseEnumPath } from "./BaseEnumPath";

/**
 * Path for a string enum property.
 *
 * The second argument is only ever a carrier of the member type: unlike a numeric enum, a string enum needs
 * no lookup at runtime, since its members already *are* the values which go on the wire. It therefore
 * accepts the plain member list just as well as the enum object, which is what makes
 * `enumType: "string-union"` workable at all - a union of string literals exists only in the
 * type system, so the generator hands over the list of members instead.
 *
 * Unless a converter says otherwise: a service may well describe an enumeration without declaring one, by
 * annotating a plain property with the values it accepts and the symbolic name of each. The members are
 * then names the service never sees, and the converter is what turns them back into the values it does -
 * a number, usually, which is why the wire value decides the literal form rather than this class.
 */
export class QEnumPath<EnumType extends StringEnumSource, WireType = string> extends BaseEnumPath<
  StringEnumSourceMember<EnumType>
> {
  public constructor(
    path: string,
    protected theEnum: EnumType,
    public readonly converter?: ValueConverter<WireType, StringEnumSourceMember<EnumType>>,
  ) {
    super(path);
    if (!theEnum) {
      throw new Error("QEnumPath: Enum or member list must be supplied! ");
    }
  }

  protected mapValue(value: StringEnumSourceMember<EnumType>): string {
    if (!this.converter) {
      return formatWithQuotes(value as string);
    }
    const wireValue = this.converter.convertTo(value, URL_CONVERSION_OPTIONS);
    return typeof wireValue === "string" ? formatWithQuotes(wireValue) : formatLiteral(wireValue as any);
  }

  protected typedValue(value: StringEnumSourceMember<EnumType>): string {
    if (!this.converter) {
      return value as string;
    }
    return String(this.converter.convertTo(value, URL_CONVERSION_OPTIONS));
  }
}
