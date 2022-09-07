import { DateTimeBasePath } from "./DateTimeBase";
import { dayFn, monthFn, yearFn } from "../base/DateTimeFunctions";

export class QDatePath extends DateTimeBasePath {
  constructor(path: string) {
    super(path);
  }

  public year = yearFn(this.path);
  public month = monthFn(this.path);
  public day = dayFn(this.path);
}
