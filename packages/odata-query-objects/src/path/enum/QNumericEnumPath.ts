import { NumericEnumLike, NumericEnumMember } from "../../enum/EnumModel";
import { NumericEnumConverter } from "../../enum/NumericEnumConverter";
import { formatWithQuotes } from "../../param/UrlParamHelper";
import { BaseEnumPath } from "./BaseEnumPath";

export class QNumericEnumPath<EnumType extends NumericEnumLike> extends BaseEnumPath<NumericEnumMember<EnumType>> {
  public readonly converter: NumericEnumConverter<EnumType>;

  public constructor(
    path: string,
    protected theEnum: EnumType,
  ) {
    super(path);
    if (!theEnum) {
      throw new Error("Enum must be supplied!");
    }
    this.converter = new NumericEnumConverter<EnumType>(theEnum);
  }

  /**
   * We require the string value of the enum for any OData operation
   */
  protected mapValue(value: NumericEnumMember<EnumType>): string {
    return formatWithQuotes(this.converter.convertTo(value)!);
  }
}
