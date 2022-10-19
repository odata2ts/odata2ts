import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";

export interface PrefixModel {
  prefix: string;
  value: string;
}

export const stringToPrefixModelConverter: ValueConverter<string, PrefixModel> = {
  id: "stringToPrefixModelConverter",
  from: "Edm.String",
  to: "@odata2ts/test-converters.PrefixModel",

  convertFrom(value: ParamValueModel<string>): ParamValueModel<PrefixModel> {
    return typeof value === "string" ? { prefix: "PREFIX_", value } : value;
  },
  convertTo(value: ParamValueModel<PrefixModel>): ParamValueModel<string> {
    return typeof value === "object" ? value?.value : value;
  },
};
