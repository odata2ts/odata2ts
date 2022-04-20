import { DateTimeBasePath } from "./DateTimeBase";
import { hourFn, minuteFn, secondFn } from "../base/DateTimeFunctions";

export class QTimePath extends DateTimeBasePath {
  protected getFinalValue(value: string | QTimePath) {
    return typeof value === "string"
      ? `time'${value}'`
      : typeof value.getPath === "function"
      ? value.getPath()
      : "null";
  }

  public hour = hourFn(this.getPath());
  public minute = minuteFn(this.getPath());
  public second = secondFn(this.getPath());
}
