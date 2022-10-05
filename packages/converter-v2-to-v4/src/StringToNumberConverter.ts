import { ParamValueModel, ValueConverter } from "@odata2ts/odata-query-objects";

export const stringToNumberConverter: ValueConverter<string, number> = {
  id: "StringToNumber",
  from: "string",
  to: "number",

  convertFrom: function (value: ParamValueModel<string>): ParamValueModel<number> {
    if (typeof value !== "string") {
      return value;
    }

    const val = Number(value);
    return !isNaN(val) ? val : undefined;
  },

  convertTo: function (value: ParamValueModel<number>): ParamValueModel<string> {
    if (typeof value !== "number") {
      return value;
    }

    return !isNaN(value) ? String(value) : undefined;
  },
};
