import { formatWithTypePrefix } from "../../param/UrlParamHelper";
import { GUID_V2_TYPE_PREFIX } from "../../param/v2/QGuidV2Param";
import { QBasePath } from "../base/QBasePath";

export class QGuidV2Path<ConvertedType = string> extends QBasePath<string, ConvertedType> {
  protected formatValue(value: string): string {
    return formatWithTypePrefix(GUID_V2_TYPE_PREFIX, value);
  }
}
