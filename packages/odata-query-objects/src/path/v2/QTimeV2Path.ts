import { DateTimeBasePath } from "./DateTimeBase";
import { hourFn, minuteFn, secondFn } from "../base/DateTimeFunctions";

export class QTimeV2Path extends DateTimeBasePath {
  public static getUrlConformValue(value: string) {
    return `time'${value}'`;
  }

  protected getFinalValue(value: string | QTimeV2Path) {
    return typeof value === "string"
      ? QTimeV2Path.getUrlConformValue(value)
      : typeof value.getPath === "function"
      ? value.getPath()
      : "null";
  }

  public hour = hourFn(this.getPath());
  public minute = minuteFn(this.getPath());
  public second = secondFn(this.getPath());
}
