import { dateTimeToDateTimeOffsetConverter } from "./DateTimeToDateTimeOffsetConverter";
import { stringToNumberConverter } from "./StringToNumberConverter";
import { timeToTimeOfDayConverter } from "./TimeToTimeOfDayConverter";

export { dateTimeToDateTimeOffsetConverter } from "./DateTimeToDateTimeOffsetConverter";
export { stringToNumberConverter } from "./StringToNumberConverter";
export { timeToTimeOfDayConverter } from "./TimeToTimeOfDayConverter";

const allConverters = [dateTimeToDateTimeOffsetConverter, stringToNumberConverter, timeToTimeOfDayConverter];

export default function (specifiedConverters: Array<string> | undefined) {
  const converters = !specifiedConverters?.length
    ? allConverters
    : allConverters.filter((c) => specifiedConverters.includes(c.id));

  return {
    id: "V2ToV4",
    converters,
  };
}
