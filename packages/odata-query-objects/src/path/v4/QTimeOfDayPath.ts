import { hourFn, minuteFn, secondFn } from "../base/DateTimeFunctions";
import { DateTimeBasePath } from "./DateTimeBase";

export class QTimeOfDayPath<ConvertedType = string> extends DateTimeBasePath<ConvertedType> {
  hour = hourFn(this.path);
  minute = minuteFn(this.path);
  second = secondFn(this.path);
}
