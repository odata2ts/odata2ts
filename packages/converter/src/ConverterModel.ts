export type ParamValueModel<Type> = Type | null | undefined;

export interface IdentityConverter<OriginalType, ConvertedType> extends ValueConverter<OriginalType, ConvertedType> {}

export interface ValueConverter<OriginalType, ConvertedType> {
  id: string;
  from: string | Array<string>;
  to: string;
  convertFrom(value: ParamValueModel<OriginalType>): ParamValueModel<ConvertedType>;
  convertTo(value: ParamValueModel<ConvertedType>): ParamValueModel<OriginalType>;
}

export interface ChainableValueConverter<OriginalType, ConvertedType>
  extends ValueConverter<OriginalType, ConvertedType> {
  chain<T>(converterToChain: ValueConverter<ConvertedType, T>): ChainableValueConverter<OriginalType, T>;
}
