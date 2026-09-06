import { StringEnumSource, StringEnumSourceMember } from "../../enum/EnumModel";
import { filterHas } from "../base/BaseFunctions";
import { QEnumPath } from "./QEnumPath";

/**
 * Path for a string enum property whose type is declared `IsFlags="true"`, i.e. one whose members are bits
 * and may be combined.
 *
 * All it adds to {@link QEnumPath} is the `has` operator, which is what `IsFlags` licenses and which V4
 * defines for no other type. An enum without the flag gets the plain path, so `has` cannot be reached
 * where the service would evaluate it as bit arithmetic over values that are not bits.
 */
export class QFlagsEnumPath<EnumType extends StringEnumSource> extends QEnumPath<EnumType> {
  public has = filterHas<StringEnumSourceMember<EnumType>>(this.path, this.mapValue.bind(this));
}
