import { NumberFilterFunctions, NumberFilterOperators } from "../../odata/ODataModel";
import { InputModel, QBasePath } from "../base/QBasePath";

export abstract class QNumberV2Base<
  BaseType extends number | string,
  ConvertedType,
  SubClass extends QNumberV2Base<BaseType, ConvertedType, any>
> extends QBasePath<BaseType, ConvertedType> {
  protected formatValue(value: BaseType): string {
    return String(value);
  }

  protected abstract createNewFunctionPath(func: NumberFilterFunctions): SubClass;

  protected abstract createNewOperationPath(
    operator: NumberFilterOperators,
    value: InputModel<this["converter"]>
  ): SubClass;

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
