import { StringEnumSource, StringEnumSourceMember } from "../../enum/EnumModel";
import { formatWithQuotes } from "../../param/UrlParamHelper";
import { BaseEnumPath } from "./BaseEnumPath";

/**
 * Path for a string enum property.
 *
 * The second argument is only ever a carrier of the member type: unlike a numeric enum, a string enum needs
 * no lookup at runtime, since its members already *are* the values which go on the wire. It therefore
 * accepts the plain member list just as well as the enum object, which is what makes
 * `enumType: "string-union"` workable at all - a union of string literals exists only in the
 * type system, so the generator hands over the list of members instead.
 */
export class QEnumPath<EnumType extends StringEnumSource> extends BaseEnumPath<StringEnumSourceMember<EnumType>> {
  public constructor(
    path: string,
    protected theEnum: EnumType,
  ) {
    super(path);
    if (!theEnum) {
      throw new Error("QEnumPath: Enum or member list must be supplied! ");
    }
  }

  protected mapValue(value: StringEnumSourceMember<EnumType>): string {
    return formatWithQuotes(value as string);
  }
}
