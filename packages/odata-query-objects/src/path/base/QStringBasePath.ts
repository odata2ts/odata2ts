import { StringFilterFunctions } from "../../odata/ODataModel";
import { buildFunctionExpression, formatWithQuotes } from "../../param/UrlParamHelper";
import { QFilterExpression } from "../../QFilterExpression";
import { InputModel, QBasePath } from "./QBasePath";

export abstract class QStringBasePath<SubClass extends QStringBasePath<any, any>, ConvertedType> extends QBasePath<
  string,
  ConvertedType
> {
  protected abstract create(path: string): SubClass;

  protected formatValue = formatWithQuotes;

  protected getFunctionExpression(func: StringFilterFunctions, value: InputModel<this["converter"]>) {
    const converted = this.convertInput(value);
    return buildFunctionExpression(func, this.path, converted);
  }

  protected buildFunctionFilter(func: StringFilterFunctions, value: InputModel<this["converter"]>) {
    return new QFilterExpression(this.getFunctionExpression(func, value));
  }

  protected buildNoValueFunc(func: StringFilterFunctions) {
    return this.create(buildFunctionExpression(func, this.path));
  }

  public concatPrefix(value: InputModel<this["converter"]>) {
    const converted = this.convertInput(value);
    return this.create(buildFunctionExpression(StringFilterFunctions.CONCAT, converted, this.path));
  }

  public concatSuffix(value: InputModel<this["converter"]>) {
    return this.create(this.getFunctionExpression(StringFilterFunctions.CONCAT, value));
  }

  public startsWith(value: InputModel<this["converter"]>) {
    return this.buildFunctionFilter(StringFilterFunctions.STARTS_WITH, value);
  }

  public endsWith(value: InputModel<this["converter"]>) {
    return this.buildFunctionFilter(StringFilterFunctions.ENDS_WITH, value);
  }

  public toLower() {
    return this.buildNoValueFunc(StringFilterFunctions.TO_LOWER);
  }

  public toUpper() {
    return this.buildNoValueFunc(StringFilterFunctions.TO_UPPER);
  }

  public trim() {
    return this.buildNoValueFunc(StringFilterFunctions.TRIM);
  }
}
