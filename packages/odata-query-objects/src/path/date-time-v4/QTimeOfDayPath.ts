import { DateTimeBasePath } from "./DateTimeBase";
import { hourFn, minuteFn, secondFn } from "./DateTimeFunctions";

export class QTimeOfDayPath extends DateTimeBasePath {
  constructor(path: string) {
    super(path);
  }

  public withPath(newPath: string): QTimeOfDayPath {
    return new QTimeOfDayPath(newPath);
  }

  hour = hourFn(this.path);
  minute = minuteFn(this.path);
  second = secondFn(this.path);
}
