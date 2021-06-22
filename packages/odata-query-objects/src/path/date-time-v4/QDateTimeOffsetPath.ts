import { DateTimeBasePath } from "./DateTimeBase";
import { dayFn, hourFn, minuteFn, monthFn, secondFn, yearFn } from "./DateTimeFunctions";
import { DateTimeFilterFunctions } from "../../odata/ODataModel";
import { QDatePath } from "./QDatePath";
import { QTimeOfDayPath } from "./QTimeOfDayPath";

export class QDateTimeOffsetPath extends DateTimeBasePath {
  constructor(path: string) {
    super(path);
  }

  public year = yearFn(this.path);
  public month = monthFn(this.path);
  public day = dayFn(this.path);

  public hour = hourFn(this.path);
  public minute = minuteFn(this.path);
  public second = secondFn(this.path);

  public date() {
    const pathExpression = this.buildNoValueFunc(DateTimeFilterFunctions.DATE);
    return new QDatePath(pathExpression);
  }

  public time() {
    const pathExpression = this.buildNoValueFunc(DateTimeFilterFunctions.TIME);
    return new QTimeOfDayPath(pathExpression);
  }
}
