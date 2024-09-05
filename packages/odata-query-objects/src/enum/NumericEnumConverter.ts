import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";
import { NumericEnumLike, NumericEnumMember } from "./EnumModel";

export class NumericEnumConverter<EnumType extends NumericEnumLike>
  implements ValueConverter<string, NumericEnumMember<EnumType>>
{
  public from = "Edm.EnumType";
  public id = "NumericEnumConverter";
  public to = "enum";

  constructor(protected theEnum: EnumType) {}

  convertFrom(value: ParamValueModel<string>): ParamValueModel<NumericEnumMember<EnumType>> {
    return typeof value !== "string" ? value : (this.theEnum[value] as NumericEnumMember<EnumType>);
  }

  convertTo(value: ParamValueModel<NumericEnumMember<EnumType>>): ParamValueModel<string> {
    return this.theEnum[value as number];
  }
}
