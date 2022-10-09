import { dateTimeToDateTimeOffsetConverter } from "./DateTimeToDateTimeOffsetConverter";
import { stringToNumberConverter } from "./StringToNumberConverter";
import { timeToTimeOfDayConverter } from "./TimeToTimeOfDayConverter";

export { dateTimeToDateTimeOffsetConverter } from "./DateTimeToDateTimeOffsetConverter";
export { stringToNumberConverter } from "./StringToNumberConverter";
export { timeToTimeOfDayConverter } from "./TimeToTimeOfDayConverter";

export default {
  id: "V2ToV4",
  converters: [dateTimeToDateTimeOffsetConverter, stringToNumberConverter, timeToTimeOfDayConverter],
};
