import { ValueConverter } from "@odata2ts/converter-api";
import { QValuePathModel } from "../path/QPathModel";
import { FlexibleConversionModel, QueryObjectModel } from "../QueryObjectModel";

const PRIMITIVE_VALUE_REFERENCE = "$it";

export abstract class QPrimitiveCollection<Type, ConvertedType, QType extends QValuePathModel>
  implements QueryObjectModel<ConvertedType>
{
  public abstract readonly it: QType;

  constructor(
    protected prefix?: string,
    protected converter?: ValueConverter<Type, ConvertedType>,
  ) {}

  protected withPrefix() {
    return this.prefix ? `${this.prefix}/${PRIMITIVE_VALUE_REFERENCE}` : PRIMITIVE_VALUE_REFERENCE;
  }

  public convertFromOData(odataModel: FlexibleConversionModel<Type>): FlexibleConversionModel<ConvertedType> {
    if (odataModel === null) {
      return null;
    }
    if (odataModel === undefined) {
      return undefined;
    }

    const converter = this.it.converter;
    return !converter
      ? odataModel
      : Array.isArray(odataModel)
        ? odataModel.map((om) => converter.convertFrom(om))
        : converter.convertFrom(odataModel);
  }

  public convertToOData(userModel: FlexibleConversionModel<ConvertedType>): FlexibleConversionModel<Type> {
    if (userModel === null) {
      return null;
    }
    if (typeof userModel === "undefined") {
      return userModel;
    }

    const converter = this.it.converter;
    return !converter
      ? userModel
      : Array.isArray(userModel)
        ? userModel.map((um) => converter.convertTo(um))
        : converter.convertTo(userModel);
  }
}
