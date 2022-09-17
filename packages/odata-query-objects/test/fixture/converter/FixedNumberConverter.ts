import { ParamValueModel, ValueConverter } from "../../../src";

class FixedNumberConverter implements ValueConverter<number, string> {
  convertFrom(value: ParamValueModel<number>): ParamValueModel<string> {
    return String(value);
  }

  convertTo(value: ParamValueModel<string>): ParamValueModel<number> {
    return Number(value);
  }
}

export const fixedNumberConverter = new FixedNumberConverter();
