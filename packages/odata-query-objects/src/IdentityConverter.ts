import { IdentityConverter, ParamValueModel, ValueConverter } from "@odata2ts/converter-api";

export class IdentityConverterImpl<T> implements IdentityConverter<T> {
  id = "Identity";
  from = "any";
  to = "any";

  convertFrom(value: ParamValueModel<T>) {
    return value;
  }

  convertTo(value: ParamValueModel<T>) {
    return value;
  }
}

const identityConverter = new IdentityConverterImpl();

export function getIdentityConverter<T>() {
  return identityConverter as IdentityConverter<T>;
}
