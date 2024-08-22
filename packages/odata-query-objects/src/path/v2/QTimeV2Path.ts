import { formatWithTypePrefix } from "../../param/UrlParamHelper";
import { TIME_V2_TYPE_PREFIX } from "../../param/v2/QTimeV2Param";
import { QBasePath } from "../base/QBasePath";
import { hourFn, minuteFn, secondFn } from "./DateTimeFunctions";

export class QTimeV2Path<ConvertedType = string> extends QBasePath<string, ConvertedType> {
  protected formatValue(value: string): string {
    return formatWithTypePrefix(TIME_V2_TYPE_PREFIX, value);
  }

  public hour = hourFn(this.getPath());
  public minute = minuteFn(this.getPath());
  public second = secondFn(this.getPath());
}
