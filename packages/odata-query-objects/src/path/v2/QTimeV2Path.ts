import { URL_PARAM_CONFIG } from "../../param/v2/QTimeV2Param";
import { hourFn, minuteFn, secondFn } from "../base/DateTimeFunctions";
import { DateTimeBasePath } from "./DateTimeBase";

export class QTimeV2Path extends DateTimeBasePath {
  protected getUrlParamConfig() {
    return URL_PARAM_CONFIG;
  }

  public hour = hourFn(this.getPath());
  public minute = minuteFn(this.getPath());
  public second = secondFn(this.getPath());
}
