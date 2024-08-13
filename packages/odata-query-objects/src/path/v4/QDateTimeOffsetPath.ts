import { DateTimeFilterFunctions } from "../../odata/ODataModel";
import { buildFunctionExpression } from "../../param/UrlParamHelper";
import { QBasePath } from "../base/QBasePath";
import { dayFn, hourFn, minuteFn, monthFn, secondFn, yearFn } from "./DateTimeFunctions.js";
import { identityFormatter } from "./IdentityFormatter.js";
import { QDatePath } from "./QDatePath.js";
import { QTimeOfDayPath } from "./QTimeOfDayPath.js";

export class QDateTimeOffsetPath<ConvertedType = string> extends QBasePath<string, ConvertedType> {
  protected formatValue = identityFormatter;

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
