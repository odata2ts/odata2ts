import { ParamValueModel } from "../param/UrlParamModel";
import { ValueConverter } from "./ConverterModel";

export const dateTimeOffsetToDateConverter: ValueConverter<string, Date> = {
  id: "Iso8601ToDate",
  from: "Edm.DateTimeOffset",
  to: "Date",

  convertFrom: (value: ParamValueModel<string>) => {
    return typeof value === "string" ? new Date(value) : value;
  },

  convertTo: (value: ParamValueModel<Date>) => {
    return value ? value.toISOString() : value;
  },
};

export default dateTimeOffsetToDateConverter;
