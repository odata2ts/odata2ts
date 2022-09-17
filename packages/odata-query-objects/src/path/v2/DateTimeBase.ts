import { StandardFilterOperators } from "../../odata/ODataModel";
import { getExpressionValue } from "../../param/UrlParamHelper";
import { UrlParamModel } from "../../param/UrlParamModel";
import { QFilterExpression } from "../../QFilterExpression";
import { QOrderByExpression } from "../../QOrderByExpression";
import { QBasePath } from "../base/QBasePath";

export abstract class DateTimeBasePath<ConvertedType> extends QBasePath<string, ConvertedType> {
  protected abstract getUrlParamConfig(): UrlParamModel | undefined;
}
