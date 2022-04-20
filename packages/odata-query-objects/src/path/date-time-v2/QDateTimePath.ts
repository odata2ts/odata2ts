import { DateTimeBasePath } from "./DateTimeBase";
import { dayFn, hourFn, minuteFn, monthFn, secondFn, yearFn } from "../base/DateTimeFunctions";

export class QDateTimePath extends DateTimeBasePath {
  protected getFinalValue(value: string | QDateTimePath) {
    return typeof value === "string"
      ? `datetime'${value}'`
      : typeof value.getPath === "function"
      ? value.getPath()
      : "null";
  }

  public year = yearFn(this.getPath());
  public month = monthFn(this.getPath());
  public day = dayFn(this.getPath());

  public hour = hourFn(this.getPath());
  public minute = minuteFn(this.getPath());
  public second = secondFn(this.getPath());
}
