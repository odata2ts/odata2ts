import { DateTimeFilterFunctions } from "../../odata/ODataModel";
import { buildFunctionExpression } from "../../param/UrlParamHelper";
import { dayFn, hourFn, minuteFn, monthFn, secondFn, yearFn } from "../base/DateTimeFunctions";
import { DateTimeBasePath } from "./DateTimeBase";
import { QDatePath } from "./QDatePath";
import { QTimeOfDayPath } from "./QTimeOfDayPath";

export class QDateTimeOffsetPath<ConvertedType = string> extends DateTimeBasePath<ConvertedType> {
  public year = yearFn(this.path);
  public month = monthFn(this.path);
  public day = dayFn(this.path);

  public hour = hourFn(this.path);
  public minute = minuteFn(this.path);
  public second = secondFn(this.path);

  public date() {
    const pathExpression = buildFunctionExpression(DateTimeFilterFunctions.DATE, this.path);
    return new QDatePath(pathExpression);
  }

  public time() {
    const pathExpression = buildFunctionExpression(DateTimeFilterFunctions.TIME, this.path);
    return new QTimeOfDayPath(pathExpression);
  }
}
