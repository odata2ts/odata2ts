import { StringFilterFunctions } from "../../odata/ODataModel";
import { buildFunctionExpression, formatWithQuotes, isPathValue } from "../../param/UrlParamHelper";
import { QFilterExpression } from "../../QFilterExpression";
import { QValuePathModel } from "../QPathModel";
import { InputModel, QBasePath } from "./QBasePath";

/**
 * The character positions `substring` takes. They are `Edm.Int32` and therefore untouched by this path's
 * converter, which only ever applies to the string value itself.
 */
export type PositionModel = QValuePathModel | number;

function formatPosition(position: PositionModel): string {
  return isPathValue(position) ? position.getPath() : String(position);
}

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

  /**
   * Cut out a part of the value string, starting at the given zero-based character position and running
   * to the end - or, with the second argument, spanning that number of characters. Note that the second
   * argument is a **length**, unlike the end position JS's `String.prototype.substring` expects.
   *
   * V4 knows the length argument only since 4.01, but V2 has had it from the start; we don't differentiate
   * 4.0 and 4.01, so both forms are offered for either version.
   */
  public substring(start: PositionModel, length?: PositionModel) {
    const positions = length === undefined ? [start] : [start, length];
    return this.create(
      buildFunctionExpression(StringFilterFunctions.SUBSTRING, this.path, ...positions.map(formatPosition)),
    );
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
