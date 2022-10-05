import { ParamValueModel, ValueConverter } from "@odata2ts/odata-query-objects";

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

export const timeToTimeOfDayConverter: ValueConverter<string, string> = {
  id: "TimeToTimeOfDay",
  from: "Edm.Time",
  to: "Edm.TimeOfDay",

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
