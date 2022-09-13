import { QBasePath } from "./base/QBasePath";

export class QBooleanPath extends QBasePath<boolean | QBooleanPath> {
  public equals = this.pathOperator.equals;
  public eq = this.pathOperator.equals;
  public notEquals = this.pathOperator.notEquals;
  public ne = this.pathOperator.notEquals;

  public isTrue() {
    return this.equals(true);
  }

  public isFalse() {
    return this.equals(false);
  }

  protected getOptions() {
    return undefined;
  }
}
