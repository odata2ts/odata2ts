import { QBasePath } from "../base/QBasePath.js";
import { hourFn, minuteFn, secondFn } from "./DateTimeFunctions.js";
import { identityFormatter } from "./IdentityFormatter.js";

export class QTimeOfDayPath<ConvertedType = string> extends QBasePath<string, ConvertedType> {
  protected formatValue = identityFormatter;

  hour = hourFn(this.path);
  minute = minuteFn(this.path);
  second = secondFn(this.path);
}
