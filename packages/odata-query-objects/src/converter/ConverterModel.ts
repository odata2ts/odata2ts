import { ParamValueModel } from "../param/UrlParamModel";

export interface IdentityConverter<OriginalType> extends ValueConverter<OriginalType> {}

export interface ValueConverter<OriginalType, ConvertedType = OriginalType> {
  convertFrom(value: ParamValueModel<OriginalType>): ParamValueModel<ConvertedType>;
  convertTo(value: ParamValueModel<ConvertedType>): ParamValueModel<OriginalType>;
}

export interface ChainableValueConverter<OriginalType, ConvertedType>
  extends ValueConverter<OriginalType, ConvertedType> {
  chain<T>(converterToChain: ChainableValueConverter<ConvertedType, T>): ChainableValueConverter<OriginalType, T>;
}
