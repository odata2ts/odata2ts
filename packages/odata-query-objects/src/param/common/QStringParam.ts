import { QParam } from "../../internal";
import { formatParamWithQuotes, parseWithQuotes } from "../UrlParamHelper";

export class QStringParam<ConvertedType = string> extends QParam<string, ConvertedType> {
  getUrlConformValue = formatParamWithQuotes;
  parseValueFromUrl = parseWithQuotes;
}
