import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";

export const booleanToNumberConverter: ValueConverter<boolean, number> = {
  id: "booleanToNumberConverter",
  from: "Edm.Boolean",
  to: "number",
  convertFrom: (value: ParamValueModel<boolean>): ParamValueModel<number> => {
    return typeof value !== "boolean" ? value : value ? 1 : 0;
  },
  convertTo: (value: ParamValueModel<number>): ParamValueModel<boolean> => {
    return typeof value !== "number" ? value : value === 1;
  },
};
