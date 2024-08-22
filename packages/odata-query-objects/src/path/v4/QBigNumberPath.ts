import { NumberFilterFunctions, NumberFilterOperators } from "../../odata/ODataModel";
import { buildFunctionExpression, buildOperatorExpression } from "../../param/UrlParamHelper";
import { InputModel, QBasePath } from "../base/QBasePath";

export class QBigNumberPath<ConvertedType = string> extends QBasePath<string, ConvertedType> {
  protected formatValue(value: string): string {
    return value;
  }

  private createNewFunctionPath(func: NumberFilterFunctions) {
    return new QBigNumberPath(buildFunctionExpression(func, this.path), this.converter);
  }

  private createNewOperationPath(operator: NumberFilterOperators, value: InputModel<this["converter"]>) {
    const converted = this.convertInput(value);
    return new QBigNumberPath(buildOperatorExpression(this.path, operator, converted), this.converter);
  }

  public plus(value: InputModel<this["converter"]>) {
    return this.createNewOperationPath(NumberFilterOperators.ADDITION, value);
  }
  public add = this.plus;

  public minus(value: InputModel<this["converter"]>) {
    return this.createNewOperationPath(NumberFilterOperators.SUBTRACTION, value);
  }
  public sub = this.minus;

  public multiply(value: InputModel<this["converter"]>) {
    return this.createNewOperationPath(NumberFilterOperators.MULTIPLICATION, value);
  }
  public mul = this.multiply;

  public divide(value: InputModel<this["converter"]>) {
    return this.createNewOperationPath(NumberFilterOperators.DIVISION, value);
  }
  public div = this.divide;

  public divideWithFraction(value: InputModel<this["converter"]>) {
    return this.createNewOperationPath(NumberFilterOperators.DIVISION_WITH_FRACTION, value);
  }
  public divBy = this.divideWithFraction;

  public modulo(value: InputModel<this["converter"]>) {
    return this.createNewOperationPath(NumberFilterOperators.MODULO, value);
  }
  public mod = this.modulo;

  public ceiling() {
    return this.createNewFunctionPath(NumberFilterFunctions.CEILING);
  }
  public floor() {
    return this.createNewFunctionPath(NumberFilterFunctions.FLOOR);
  }
  public round() {
    return this.createNewFunctionPath(NumberFilterFunctions.ROUND);
  }
}
