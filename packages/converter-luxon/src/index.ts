import { ConverterPackage } from "@odata2ts/converter-api";

import { dateTimeOffsetToLuxonConverter } from "./DateTimeOffsetToLuxonConverter";
import { dateToLuxonConverter } from "./DateToLuxonConverter";
import { durationToLuxonConverter } from "./DurationToLuxonConverter";
import { timeOfDayToLuxonConverter } from "./TimeOfDayToLuxonConverter";

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
export { timeOfDayToLuxonConverter, dateToLuxonConverter, dateTimeOffsetToLuxonConverter, durationToLuxonConverter };
