import { DateTimeBasePath } from "./DateTimeBase";
import { dayFn, hourFn, minuteFn, monthFn, secondFn, yearFn } from "../base/DateTimeFunctions";

export class QDateTimeV2Path extends DateTimeBasePath {
  public static getUrlConformValue(value: string) {
    return `datetime'${value}'`;
  }

  protected getFinalValue(value: string | QDateTimeV2Path) {
    return typeof value === "string"
      ? QDateTimeV2Path.getUrlConformValue(value)
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
