import { StringEnumLike, StringEnumMember } from "../../enum/EnumModel";
import { formatWithQuotes } from "../../param/UrlParamHelper";
import { BaseEnumPath } from "./BaseEnumPath";

export class QEnumPath<EnumType extends StringEnumLike> extends BaseEnumPath<StringEnumMember<EnumType>> {
  public constructor(
    path: string,
    protected theEnum: EnumType,
  ) {
    super(path);
    if (!theEnum) {
      throw new Error("Enum must be supplied!");
    }
  }

  protected mapValue(value: StringEnumMember<EnumType>): string {
    return formatWithQuotes(value as string);
  }
}
