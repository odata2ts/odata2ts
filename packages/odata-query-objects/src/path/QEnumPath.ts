import { formatWithQuotes } from "../param/UrlParamHelper";
import { QBasePath } from "./base/QBasePath.js";

export class QEnumPath<ConvertedType = string> extends QBasePath<string, ConvertedType> {
  protected formatValue = formatWithQuotes;
}
