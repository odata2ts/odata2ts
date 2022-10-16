import { ConverterPackage } from "@odata2ts/converter";

import { dateTimeOffsetToLuxonConverter } from "./DateTimeOffsetToLuxonConverter";
import { dateToLuxonConverter } from "./DateToLuxonConverter";
import { durationToLuxonConverter } from "./DurationToLuxonConverter";
import { timeOfDayToLuxonConverter } from "./TimeOfDayToLuxonConverter";

export { timeOfDayToLuxonConverter } from "./TimeOfDayToLuxonConverter";
export { dateToLuxonConverter } from "./DateToLuxonConverter";
export { dateTimeOffsetToLuxonConverter } from "./DateTimeOffsetToLuxonConverter";
export { durationToLuxonConverter } from "./DurationToLuxonConverter";

const pkg: ConverterPackage = {
  id: "Luxon",
  converters: [
    dateToLuxonConverter,
    timeOfDayToLuxonConverter,
    dateTimeOffsetToLuxonConverter,
    durationToLuxonConverter,
  ],
};
export default pkg;
