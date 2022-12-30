import { ParamValueModel } from "@odata2ts/converter-api";

import { QParam } from "../QParam";
import { formatLiteralParam, formatParamWithTypeSuffix, parseLiteral, parseWithTypeSuffix } from "../UrlParamHelper";
import { UrlExpressionValueModel, UrlValueModel } from "../UrlParamModel";

export class QStringNumberV2Param<ConvertedType = string> extends QParam<string, ConvertedType> {
  protected getTypeSuffix(): string | undefined {
    return undefined;
  }

  getUrlConformValue = (value: ParamValueModel<UrlExpressionValueModel>) => {
    const suffix = this.getTypeSuffix();
    return suffix !== undefined ? formatParamWithTypeSuffix(suffix, value) : formatLiteralParam(value);
  };
  parseValueFromUrl = (urlConformValue: UrlValueModel) => {
    const suffix = this.getTypeSuffix();
    return suffix !== undefined ? parseWithTypeSuffix(suffix, urlConformValue) : parseLiteral(urlConformValue);
  };
}
