import { ParamValueModel } from "../param/UrlParamModel";
import { ChainedConverter } from "./ChainedConverter";
import { ChainableValueConverter, IdentityConverter } from "./ConverterModel";

export class IdentityConverterImpl implements IdentityConverter<any, any> {
  convertFrom<ValueType>(value: ParamValueModel<ValueType>) {
    return value;
  }

  convertTo<ValueType>(value: ParamValueModel<ValueType>) {
    return value;
  }

  chain<T>(converterToChain: ChainableValueConverter<any, T>): ChainableValueConverter<any, T> {
    return new ChainedConverter(this, converterToChain);
  }
}

const identityConverter = new IdentityConverterImpl();

export function getIdentityConverter<T, CT>() {
  return identityConverter as IdentityConverter<T, CT>;
}
