import { DateTimeBasePath } from "./DateTimeBase";
import { dayFn, hourFn, minuteFn, monthFn, secondFn, yearFn } from "../base/DateTimeFunctions";

export class QDateTimeOffsetV2Path extends DateTimeBasePath {
  protected getFinalValue(value: string | QDateTimeOffsetV2Path) {
    return typeof value === "string"
      ? `datetimeoffset'${value}'`
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
