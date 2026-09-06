import { NumericEnumLike, NumericEnumMember } from "../../enum/EnumModel";
import { filterHas } from "../base/BaseFunctions";
import { QNumericEnumPath } from "./QNumericEnumPath";

/**
 * Path for a numeric enum property whose type is declared `IsFlags="true"`.
 *
 * The numeric counterpart of {@link QFlagsEnumPath}: `enumType` decides how the members are generated,
 * `IsFlags` decides whether they may be combined, so the two are independent and each numeric path needs
 * its flags variant just as the string one does.
 */
export class QNumericFlagsEnumPath<EnumType extends NumericEnumLike> extends QNumericEnumPath<EnumType> {
  public has = filterHas<NumericEnumMember<EnumType>>(this.path, this.mapValue.bind(this));
}
