import { ParamValueModel } from "../param/UrlParamModel";
import { ChainedConverter } from "./ChainedConverter";
import { ChainableValueConverter } from "./ConverterModel";

class V2DateTimeToDateConverter implements ChainableValueConverter<string, Date> {
  convertFrom(value: ParamValueModel<string>): ParamValueModel<Date> {
    if (typeof value !== "string") {
      return value;
    }

    const matched = value.match(/\/Date\(([0-9]+)\)\//);
    if (!matched || matched.length < 2) {
      return undefined;
    }

    return new Date(Number(matched[1]));
  }

  convertTo(value: ParamValueModel<Date>): ParamValueModel<string> {
    return value ? `/Date(${value.getTime()})/` : value;
  }

  chain<T>(converterToChain: ChainableValueConverter<Date, T>): ChainableValueConverter<string, T> {
    return new ChainedConverter(this, converterToChain);
  }
}

export const v2DateTimeToDateConverter = new V2DateTimeToDateConverter();
