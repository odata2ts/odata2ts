import { dayFn, monthFn, yearFn } from "../base/DateTimeFunctions";
import { DateTimeBasePath } from "./DateTimeBase";

export class QDatePath<ConvertedType = string> extends DateTimeBasePath<ConvertedType> {
  public year = yearFn(this.path);
  public month = monthFn(this.path);
  public day = dayFn(this.path);
}
