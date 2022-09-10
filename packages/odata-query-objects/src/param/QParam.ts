import { UrlParamValueFormatter, UrlParamValueParser } from "../internal";
import { ValueConverter } from "./ParamModel";

export abstract class QParam<Type extends string | number | boolean, ConvertedType = Type>
  implements ValueConverter<Type, ConvertedType>
{
  constructor(
    protected name: string,
    protected mappedName?: string,
    protected converter?: ValueConverter<Type, ConvertedType>
  ) {
    if (!name) {
      throw new Error("Name is required for QParam objects!");
    }
  }

  public getName() {
    return this.name;
  }

  public getMappedName() {
    return this.mappedName ?? this.getName();
  }

  public abstract formatUrlValue: UrlParamValueFormatter<Type>;

  public abstract parseUrlValue: UrlParamValueParser<Type>;

  public convertFrom(value: Type): ConvertedType {
    return this.converter ? this.converter.convertFrom(value) : (value as unknown as ConvertedType);
  }

  public convertTo(value: ConvertedType): Type {
    return this.converter ? this.converter.convertTo(value) : (value as unknown as Type);
  }
}
