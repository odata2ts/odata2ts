import { URL_PARAM_CONFIG } from "../../param/v2/QDateTimeV2Param";
import { dayFn, hourFn, minuteFn, monthFn, secondFn, yearFn } from "../base/DateTimeFunctions";
import { DateTimeBasePath } from "./DateTimeBase";

export class QDateTimeV2Path extends DateTimeBasePath {
  protected getUrlParamConfig() {
    return URL_PARAM_CONFIG;
  }

  public year = yearFn(this.getPath());
  public month = monthFn(this.getPath());
  public day = dayFn(this.getPath());

  public hour = hourFn(this.getPath());
  public minute = minuteFn(this.getPath());
  public second = secondFn(this.getPath());
}
