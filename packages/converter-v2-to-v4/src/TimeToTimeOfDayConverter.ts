import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";
import { ODataTypesV2, ODataTypesV4 } from "@odata2ts/odata-core";

function padZerosLeft(input: string, defaultValue: string) {
  if (!input) {
    return defaultValue;
  }

  const dot = input.indexOf(".");
  return (dot === -1 && input.length < 2) || dot === 1 ? `0${input}` : input;
}

function getSafeSuffixedNumber(input: string, suffix: string) {
  const asNumber = input ? Number(input) : undefined;
  return asNumber ? asNumber + suffix : "";
}

/**
 * V2 type Edm.Time is actually specified in ISO 8601 (day) duration format.
 * But Edm.Time was also intended to represent the time of a day, like 12:15:00.
 * V4 dispensed with Edm.Time and introduced two new data types: Edm.Duration and Edm.TimeOfDay.
 *
 * This converter takes an Edm.Time and converts it to Edm.TimeOfDay, which is the well known
 * ISO 8601 time format.
 */
export const timeToTimeOfDayConverter: ValueConverter<string, string> = {
  id: "timeToTimeOfDayConverter",
  from: ODataTypesV2.Time,
  to: ODataTypesV4.TimeOfDay,

  convertFrom: function (value: ParamValueModel<string>): ParamValueModel<string> {
    if (typeof value !== "string") {
      return value;
    }

    const matched = value.match(/PT((\d+)H)?((\d+)M)?(([\d.]+)S)?/);
    if (!matched || matched.length < 7) {
      return undefined;
    }
    const hours = padZerosLeft(matched[2], "00");
    const minutes = padZerosLeft(matched[4], "00");
    const seconds = padZerosLeft(matched[6], "");

    return `${hours}:${minutes}${seconds ? ":" + seconds : ""}`;
  },

  convertTo: function (value: ParamValueModel<string>): ParamValueModel<string> {
    if (typeof value !== "string") {
      return value;
    }

    const matched = value.match(/^(\d{2}):(\d{2})(:([\d.]+))?$/);
    if (!matched || matched.length < 5) {
      return undefined;
    }
    const hours = getSafeSuffixedNumber(matched[1], "H");
    const minutes = getSafeSuffixedNumber(matched[2], "M");
    const seconds = getSafeSuffixedNumber(matched[4], "S");

    return hours || minutes || seconds ? `PT${hours}${minutes}${seconds}` : "PT0H";
  },
};
