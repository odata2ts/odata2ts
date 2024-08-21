import { QParam } from "../QParam.js";
import { formatParamWithQuotes, parseWithQuotes } from "../UrlParamHelper.js";

export class QStringParam<ConvertedType = string> extends QParam<string, ConvertedType> {
  protected getUrlConformValue = formatParamWithQuotes;
  protected parseValueFromUrl = parseWithQuotes;
}
