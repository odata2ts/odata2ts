import { NumberFilterFunctions, NumberFilterOperators } from "../../odata/ODataModel";
import { buildFunctionExpression, buildOperatorExpression } from "../../param/UrlParamHelper";
import { UrlExpressionValueModel } from "../../param/UrlParamModel";
import { InputModel, QBasePath } from "../base/QBasePath";
import { QNumberV2Base } from "./QNumberV2Base";

export class QStringNumberV2Path<ConvertedType = string> extends QNumberV2Base<
  string,
  ConvertedType,
  QStringNumberV2Path<ConvertedType>
> {
  protected createNewFunctionPath(func: NumberFilterFunctions): QStringNumberV2Path<ConvertedType> {
    return new QStringNumberV2Path(buildFunctionExpression(func, this.path), this.converter);
  }

  protected createNewOperationPath(operator: NumberFilterOperators, value: InputModel<this["converter"]>) {
    const converted = this.convertInput(value);
    return new QStringNumberV2Path(buildOperatorExpression(this.path, operator, converted), this.converter);
  }
}
