import { ParamValueModel, ValueConverter } from "@odata2ts/converter";

export const fixedNumberConverter: ValueConverter<number, string> = {
  id: "FixedNumber",
  from: "number",
  to: "string",
  convertFrom: (value: ParamValueModel<number>): ParamValueModel<string> => String(value),
  convertTo: (value: ParamValueModel<string>): ParamValueModel<number> => Number(value),
};
