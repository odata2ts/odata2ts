import { ParamValueModel, ValueConverter } from "@odata2ts/converter";

export const fixedBooleanConverter: ValueConverter<boolean, number> = {
  id: "FixedBoolean",
  from: "Edm.Boolean",
  to: "number",
  convertFrom: (value: ParamValueModel<boolean>): ParamValueModel<number> => {
    return value ? 1 : 0;
  },
  convertTo: (value: ParamValueModel<number>): ParamValueModel<boolean> => {
    return value === 1;
  },
};
