import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";

export const numberToStringConverter: ValueConverter<number, string> = {
  id: "numberToStringConverter",
  from: "number",
  to: "string",
  convertFrom: (value: ParamValueModel<number>): ParamValueModel<string> =>
    typeof value !== "number" ? value : String(value),
  convertTo: (value: ParamValueModel<string>): ParamValueModel<number> =>
    typeof value !== "string" ? value : Number(value),
};
