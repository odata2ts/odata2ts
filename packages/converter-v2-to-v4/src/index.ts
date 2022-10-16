import { ConverterPackage } from "@odata2ts/converter-api";

import { dateTimeToDateTimeOffsetConverter } from "./DateTimeToDateTimeOffsetConverter";
import { stringToNumberConverter } from "./StringToNumberConverter";
import { timeToDurationConverter } from "./TimeToDurationConverter";
import { timeToTimeOfDayConverter } from "./TimeToTimeOfDayConverter";

const pkg: ConverterPackage = {
  id: "V2ToV4",
  converters: [dateTimeToDateTimeOffsetConverter, stringToNumberConverter, timeToDurationConverter],
};

export default pkg;
export {
  dateTimeToDateTimeOffsetConverter,
  stringToNumberConverter,
  timeToDurationConverter,
  timeToTimeOfDayConverter,
};
