import { ParamValueModel, ValueConverter } from "../../../src";

export const fixedNumberConverter: ValueConverter<number, string> = {
  id: "FixedNumber",
  from: "number",
  to: "string",
  convertFrom: (value: ParamValueModel<number>): ParamValueModel<string> => String(value),
  convertTo: (value: ParamValueModel<string>): ParamValueModel<number> => Number(value),
};
