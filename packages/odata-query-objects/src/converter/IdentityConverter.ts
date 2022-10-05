import { ParamValueModel } from "../param/UrlParamModel";
import { IdentityConverter } from "./ConverterModel";

export class IdentityConverterImpl implements IdentityConverter<any, any> {
  id = "Identity";
  from = "any";
  to = "any";

  convertFrom<ValueType>(value: ParamValueModel<ValueType>) {
    return value;
  }

  convertTo<ValueType>(value: ParamValueModel<ValueType>) {
    return value;
  }
}

const identityConverter = new IdentityConverterImpl();

export function getIdentityConverter<T, CT>() {
  return identityConverter as IdentityConverter<T, CT>;
}
