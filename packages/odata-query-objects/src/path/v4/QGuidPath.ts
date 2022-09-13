import { UrlParamModel } from "../../param/UrlParamModel";
import { QBasePath } from "../base/QBasePath";

export class QGuidPath extends QBasePath<string | QGuidPath> {
  protected getOptions(): UrlParamModel | undefined {
    return undefined;
  }
  public equals = this.pathOperator.equals;
  public eq = this.pathOperator.equals;
  public notEquals = this.pathOperator.notEquals;
  public ne = this.pathOperator.notEquals;

  public lowerThan = this.pathOperator.lowerThan;
  public lt = this.pathOperator.lowerThan;

  public lowerEquals = this.pathOperator.lowerEquals;
  public le = this.pathOperator.lowerEquals;

  public greaterThan = this.pathOperator.greaterThan;
  public gt = this.greaterThan;

  public greaterEquals = this.pathOperator.greaterEquals;
  public ge = this.greaterEquals;

  public in = this.pathOperator.in;
}
