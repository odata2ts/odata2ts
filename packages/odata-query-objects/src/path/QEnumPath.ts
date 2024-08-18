import { formatWithQuotes } from "../param/UrlParamHelper.js";
import { QBasePath } from "./base/QBasePath.js";

export class QEnumPath<ConvertedType = string> extends QBasePath<string, ConvertedType> {
  protected formatValue = formatWithQuotes;
}
