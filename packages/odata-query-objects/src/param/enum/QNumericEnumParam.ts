import { NumericEnumLike, NumericEnumMember } from "../../enum/EnumModel";
import { NumericEnumConverter } from "../../enum/NumericEnumConverter";
import { BaseEnumParam } from "./BaseEnumParam";

export class QNumericEnumParam<EnumType extends NumericEnumLike> extends BaseEnumParam<NumericEnumMember<EnumType>> {
  public readonly converter: NumericEnumConverter<EnumType>;

  public constructor(
    protected theEnum: EnumType,
    name: string,
    mappedName?: string,
  ) {
    super(name, mappedName);
    if (!theEnum) {
      throw new Error("Enum must be supplied!");
    }
    this.converter = new NumericEnumConverter<EnumType>(theEnum);
  }

  protected mapValue(value: string): NumericEnumMember<EnumType> {
    return this.converter.convertFrom(value)!;
  }

  protected mapValueBack(value: NumericEnumMember<EnumType>): string {
    return this.converter.convertTo(value)!;
  }
}
