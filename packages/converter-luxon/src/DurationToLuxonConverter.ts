import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";
import { Duration } from "luxon";

export const durationToLuxonConverter: ValueConverter<string, Duration> = {
  id: "durationToLuxonConverter",
  from: "Edm.Duration",
  to: "luxon.Duration",

  convertFrom: function (value: ParamValueModel<string>): ParamValueModel<Duration> {
    if (typeof value !== "string") {
      return value;
    }

    const luxon = Duration.fromISO(value);
    return luxon.isValid ? luxon : undefined;
  },

  convertTo: function (value: ParamValueModel<Duration>): ParamValueModel<string> {
    if (!value) {
      return value;
    }

    return value.isValid ? value.toISO() : undefined;
  },
};
