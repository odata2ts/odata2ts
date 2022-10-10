import { ParamValueModel, ValueConverter } from "@odata2ts/converter";

export const fixedPrefixConverter: ValueConverter<string, string> = {
  id: "FixedPrefix",
  from: "string",
  to: "string",

  convertFrom(value: ParamValueModel<string>): ParamValueModel<string> {
    return typeof value === "string" ? `PREFIX_${value}` : value;
  },
  convertTo(value: ParamValueModel<string> | undefined): ParamValueModel<string> {
    return typeof value === "string" ? value.replace(/^PREFIX_/, "") : value;
  },
};
