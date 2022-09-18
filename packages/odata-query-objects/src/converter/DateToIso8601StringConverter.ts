import { ParamValueModel } from "../param/UrlParamModel";
import { ChainedConverter } from "./ChainedConverter";
import { ChainableValueConverter, ValueConverter } from "./ConverterModel";

class DateToIso8601StringConverter implements ChainableValueConverter<Date, string> {
  convertFrom(value: ParamValueModel<Date>) {
    return value ? value.toISOString() : value;
  }

  convertTo(value: ParamValueModel<string>) {
    return typeof value === "string" ? new Date(value) : value;
  }

  chain<T>(converterToChain: ValueConverter<string, T>): ChainableValueConverter<Date, T> {
    return new ChainedConverter(this, converterToChain);
  }
}

export const dateToIso8601Converter = new DateToIso8601StringConverter();
