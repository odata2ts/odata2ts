import { dayFn, monthFn, yearFn } from "../base/DateTimeFunctions";
import { QBasePath } from "../base/QBasePath";
import { identityFormatter } from "./IdentityFormatter";

export class QDatePath<ConvertedType = string> extends QBasePath<string, ConvertedType> {
  protected formatValue = identityFormatter;

  public year = yearFn(this.path);
  public month = monthFn(this.path);
  public day = dayFn(this.path);
}
