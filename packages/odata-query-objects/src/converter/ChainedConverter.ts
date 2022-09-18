import { ParamValueModel } from "../param/UrlParamModel";
import { ChainableValueConverter, ValueConverter } from "./ConverterModel";

export class ChainedConverter<FromType, IntermediateType, ToType> implements ChainableValueConverter<FromType, ToType> {
  constructor(
    private converter: ValueConverter<FromType, IntermediateType>,
    private converter2: ValueConverter<IntermediateType, ToType>
  ) {}

  public convertFrom(value: ParamValueModel<FromType>): ParamValueModel<ToType> {
    return this.converter2.convertFrom(this.converter.convertFrom(value));
  }

  public convertTo(value: ParamValueModel<ToType>): ParamValueModel<FromType> {
    return this.converter.convertTo(this.converter2.convertTo(value));
  }

  public chain<T>(converterToChain: ValueConverter<ToType, T>): ChainableValueConverter<FromType, T> {
    return new ChainedConverter(this, converterToChain);
  }
}
