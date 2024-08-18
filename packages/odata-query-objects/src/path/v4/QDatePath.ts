import { QBasePath } from "../base/QBasePath.js";
import { dayFn, monthFn, yearFn } from "./DateTimeFunctions.js";
import { identityFormatter } from "./IdentityFormatter.js";

export class QDatePath<ConvertedType = string> extends QBasePath<string, ConvertedType> {
  protected formatValue = identityFormatter;

  public year = yearFn(this.path);
  public month = monthFn(this.path);
  public day = dayFn(this.path);
}
