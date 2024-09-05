import { ValueConverter } from "@odata2ts/converter-api";
import { QValuePathModel } from "../path/QPathModel";

const PRIMITIVE_VALUE_REFERENCE = "$it";

export abstract class QPrimitiveCollection<Type, ConvertedType, QType extends QValuePathModel> {
  public readonly it;

  constructor(
    prefix?: string,
    protected converter?: ValueConverter<Type, ConvertedType>,
    protected extraData?: any,
  ) {
    const withPrefix = prefix ? `${prefix}/${PRIMITIVE_VALUE_REFERENCE}` : PRIMITIVE_VALUE_REFERENCE;
    this.it = this.createQPathType(withPrefix, converter);
  }

  protected abstract createQPathType(path: string, converter?: ValueConverter<Type, ConvertedType>): QType;

  public convertFromOData(odataModel: Array<Type> | null | undefined): Array<ConvertedType> | null | undefined {
    if (odataModel === null || odataModel === undefined) {
      return odataModel;
    }

    const converter = this.it.converter;
    return !converter ? odataModel : odataModel.map((om) => converter.convertFrom(om));
  }

  public convertToOData(userModel: Array<ConvertedType> | null | undefined): Array<Type> | null | undefined {
    if (userModel === null || userModel === undefined) {
      return userModel;
    }

    const converter = this.it.converter;
    return !converter ? userModel : userModel.map((um) => converter.convertTo(um));
  }
}
