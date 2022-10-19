import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";
import { ODataTypesV2, ODataTypesV4 } from "@odata2ts/odata-core";

export const FIXED_DATE = new Date(2022, 12, 31, 23, 59, 59);
export const FIXED_STRING = FIXED_DATE.toISOString();

export const fixedDateConverter: ValueConverter<string, Date> = {
  id: "fixedDateConverter",
  from: [
    ODataTypesV2.Time,
    ODataTypesV2.DateTime,
    ODataTypesV4.Date,
    ODataTypesV4.TimeOfDay,
    ODataTypesV4.DateTimeOffset,
    ODataTypesV4.Guid,
  ],
  to: "Date",
  convertFrom: (value: ParamValueModel<string>): ParamValueModel<Date> => FIXED_DATE,
  convertTo: (value: ParamValueModel<Date>): ParamValueModel<string> => FIXED_STRING,
};
