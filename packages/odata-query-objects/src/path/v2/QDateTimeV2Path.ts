import { formatWithTypePrefix } from "../../param/UrlParamHelper";
import { DATE_TIME_V2_TYPE_PREFIX } from "../../param/v2/QDateTimeV2Param";
import { QBasePath } from "../base/QBasePath";
import { dayFn, hourFn, minuteFn, monthFn, secondFn, yearFn } from "./DateTimeFunctions";

export class QDateTimeV2Path<ConvertedType = string> extends QBasePath<string, ConvertedType> {
  protected formatValue(value: string): string {
    return formatWithTypePrefix(DATE_TIME_V2_TYPE_PREFIX, value);
  }

  public year = yearFn(this.getPath());
  public month = monthFn(this.getPath());
  public day = dayFn(this.getPath());

  public hour = hourFn(this.getPath());
  public minute = minuteFn(this.getPath());
  public second = secondFn(this.getPath());
}
