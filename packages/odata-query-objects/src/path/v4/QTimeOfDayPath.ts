import { DateTimeBasePath } from "../base/DateTimeBase";
import { hourFn, minuteFn, secondFn } from "../base/DateTimeFunctions";

export class QTimeOfDayPath extends DateTimeBasePath {
  constructor(path: string) {
    super(path);
  }

  hour = hourFn(this.path);
  minute = minuteFn(this.path);
  second = secondFn(this.path);
}
