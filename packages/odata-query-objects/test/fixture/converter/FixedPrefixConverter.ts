import { ParamValueModel, ValueConverter } from "../../../src";

export const fixedPrefixConverter: ValueConverter<string, string> = {
  convertFrom(value: ParamValueModel<string>): ParamValueModel<string> {
    return typeof value === "string" ? `PREFIX_${value}` : value;
  },
  convertTo(value: ParamValueModel<string> | undefined): ParamValueModel<string> {
    return typeof value === "string" ? value.replace(/^PREFIX_/, "") : value;
  },
};
