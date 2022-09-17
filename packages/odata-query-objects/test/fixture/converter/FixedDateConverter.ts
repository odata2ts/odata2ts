import { ParamValueModel, ValueConverter } from "../../../src";

export const FIXED_DATE = new Date(2022, 12, 31, 23, 59, 59);
export const FIXED_STRING = FIXED_DATE.toISOString();

class FixedDateConverter implements ValueConverter<string, Date> {
  convertFrom(value: ParamValueModel<string>): ParamValueModel<Date> {
    return FIXED_DATE;
  }

  convertTo(value: ParamValueModel<Date>): ParamValueModel<string> {
    return FIXED_STRING;
  }
}

export const fixedDateConverter = new FixedDateConverter();
