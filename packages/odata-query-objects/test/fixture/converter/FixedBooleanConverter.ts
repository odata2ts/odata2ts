import { ParamValueModel, ValueConverter } from "../../../src";

class FixedBooleanConverter implements ValueConverter<boolean, number> {
  convertFrom(value: ParamValueModel<boolean>): ParamValueModel<number> {
    return value ? 1 : 0;
  }

  convertTo(value: ParamValueModel<number>): ParamValueModel<boolean> {
    return value === 1;
  }
}

export const fixedBooleanConverter = new FixedBooleanConverter();
