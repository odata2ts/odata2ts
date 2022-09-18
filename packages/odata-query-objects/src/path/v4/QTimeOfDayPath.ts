import { hourFn, minuteFn, secondFn } from "../base/DateTimeFunctions";
import { QBasePath } from "../base/QBasePath";
import { identityFormatter } from "./IdentityFormatter";

export class QTimeOfDayPath<ConvertedType = string> extends QBasePath<string, ConvertedType> {
  protected formatValue = identityFormatter;

  hour = hourFn(this.path);
  minute = minuteFn(this.path);
  second = secondFn(this.path);
}
