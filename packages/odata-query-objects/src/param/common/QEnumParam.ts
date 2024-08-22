import { QParam } from "../QParam";
import { formatParamWithQuotes, parseWithQuotes } from "../UrlParamHelper";

export class QEnumParam<ConvertedType = string> extends QParam<string, ConvertedType> {
  protected getUrlConformValue = formatParamWithQuotes;
  protected parseValueFromUrl = parseWithQuotes;
}
