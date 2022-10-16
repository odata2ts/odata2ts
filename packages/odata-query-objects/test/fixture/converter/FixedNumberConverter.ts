import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";

export const fixedNumberConverter: ValueConverter<number, string> = {
  id: "FixedNumber",
  from: "number",
  to: "string",
  convertFrom: (value: ParamValueModel<number>): ParamValueModel<string> => String(value),
  convertTo: (value: ParamValueModel<string>): ParamValueModel<number> => Number(value),
};
