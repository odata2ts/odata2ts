import { dateTimeToDateTimeOffsetConverter } from "./DateTimeToDateTimeOffsetConverter";
import { stringToNumberConverter } from "./StringToNumberConverter";
import { timeToTimeOfDayConverter } from "./TimeToTimeOfDayConverter";

export default {
  converters: [dateTimeToDateTimeOffsetConverter, stringToNumberConverter, timeToTimeOfDayConverter],
  preset: {
    id: "V2ToV4",
    mapping: {
      "Edm.DateTime": "DateTimeToDateTimeOffset",
      "Edm.Number": "StringToNumber",
      "Edm.Time": "TimeToTimeOfDay",
    },
  },
};
