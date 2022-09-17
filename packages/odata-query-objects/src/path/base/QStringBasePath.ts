import { StringFilterFunctions } from "../../odata/ODataModel";
import { buildFunctionExpression, withQuotes } from "../../param/UrlParamHelper";
import { QFilterExpression } from "../../QFilterExpression";
import { QNumberPath } from "../QNumberPath";
import { InputModel, QBasePath } from "./QBasePath";

export abstract class QStringBasePath<SubClass extends QStringBasePath<any, any>, ConvertedType> extends QBasePath<
  string,
  ConvertedType
> {
  protected abstract create(path: string): SubClass;

  protected formatValue = withQuotes;

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

  public indexOf(value: InputModel<this["converter"]>) {
    return new QNumberPath(this.getFunctionExpression(StringFilterFunctions.INDEX_OF, value));
  }

  public length() {
    const pathExpression = this.buildNoValueFunc(StringFilterFunctions.LENGTH);
    return new QNumberPath(pathExpression.getPath());
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
