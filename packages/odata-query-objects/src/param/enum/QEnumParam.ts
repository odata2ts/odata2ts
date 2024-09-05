import { StringEnumLike, StringEnumMember } from "../../enum/EnumModel";
import { BaseEnumParam } from "./BaseEnumParam";

export class QEnumParam<EnumType extends StringEnumLike> extends BaseEnumParam<StringEnumMember<EnumType>> {
  protected mapValue(value: string): StringEnumMember<EnumType> {
    return value;
  }

  protected mapValueBack(value: StringEnumMember<EnumType>): string {
    return value as string;
  }
}
