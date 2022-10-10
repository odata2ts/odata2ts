import { ParamValueModel, ValueConverter } from "@odata2ts/converter";

export const FIXED_DATE = new Date(2022, 12, 31, 23, 59, 59);
export const FIXED_STRING = FIXED_DATE.toISOString();

export const fixedDateConverter: ValueConverter<string, Date> = {
  id: "FixedDate",
  from: "Edm.Date",
  to: "Date",
  convertFrom: (value: ParamValueModel<string>): ParamValueModel<Date> => FIXED_DATE,
  convertTo: (value: ParamValueModel<Date>): ParamValueModel<string> => FIXED_STRING,
};
