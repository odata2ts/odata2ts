import { dateTimeOffsetToLuxonConverter } from "./DateTimeOffsetToLuxonConverter";
import { dateToLuxonConverter } from "./DateToLuxonConverter";
import { durationToLuxonConverter } from "./DurationToLuxonConverter";
import { timeOfDayToLuxonConverter } from "./TimeOfDayToLuxonConverter";
export { timeOfDayToLuxonConverter } from "./TimeOfDayToLuxonConverter";
export { dateToLuxonConverter } from "./DateToLuxonConverter";
export { dateTimeOffsetToLuxonConverter } from "./DateTimeOffsetToLuxonConverter";
export { durationToLuxonConverter } from "./DurationToLuxonConverter";

const allConverters = [
  dateToLuxonConverter,
  timeOfDayToLuxonConverter,
  dateTimeOffsetToLuxonConverter,
  durationToLuxonConverter,
];

export default function (specifiedConverters: Array<string> | undefined) {
  const converters = !specifiedConverters?.length
    ? allConverters
    : allConverters.filter((c) => specifiedConverters.includes(c.id));

  return {
    id: "Luxon",
    converters,
  };
}
