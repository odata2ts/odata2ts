import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";
import { DateTime } from "luxon";

export const dateTimeOffsetToLuxonConverter: ValueConverter<string, DateTime> = {
  id: "dateTimeOffsetToLuxonConverter",
  from: "Edm.DateTimeOffset",
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

    return value.isValid ? value.setZone("utc").toISO() : undefined;
  },
};
