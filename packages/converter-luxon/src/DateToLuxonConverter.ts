import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";
import { DateTime } from "luxon";

export const dateToLuxonConverter: ValueConverter<string, DateTime> = {
  id: "dateToLuxonConverter",
  from: "Edm.Date",
  to: "luxon.DateTime",

  convertFrom: function (value: ParamValueModel<string>): ParamValueModel<DateTime> {
    if (typeof value !== "string") {
      return value;
    }

    const luxon = DateTime.fromISO(value);
    return luxon.isValid ? luxon : undefined;
  },

  convertTo: function (value: ParamValueModel<DateTime>): ParamValueModel<string> {
    if (!value) {
      return value;
    }

    return value.isValid ? value.toISO().split("T")[0] : undefined;
  },
};
