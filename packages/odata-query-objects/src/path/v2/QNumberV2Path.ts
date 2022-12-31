import { NumberFilterFunctions, NumberFilterOperators } from "../../odata/ODataModel";
import { buildFunctionExpression, buildOperatorExpression } from "../../param/UrlParamHelper";
import { InputModel } from "../base/QBasePath";
import { QNumberV2Base } from "./QNumberV2Base";

export class QNumberV2Path<ConvertedType = number> extends QNumberV2Base<
  number,
  ConvertedType,
  QNumberV2Path<ConvertedType>
> {
  protected createNewFunctionPath(func: NumberFilterFunctions) {
    return new QNumberV2Path(buildFunctionExpression(func, this.path), this.converter);
  }

  protected createNewOperationPath(operator: NumberFilterOperators, value: InputModel<this["converter"]>) {
    const converted = this.convertInput(value);
    return new QNumberV2Path(buildOperatorExpression(this.path, operator, converted), this.converter);
  }
}
