import { formatWithQuotes } from "../internal";
import { QBasePath } from "./base/QBasePath";

export class QEnumPath<ConvertedType = string> extends QBasePath<string, ConvertedType> {
  protected formatValue = formatWithQuotes;
}
