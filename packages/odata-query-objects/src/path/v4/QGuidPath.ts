import { QBasePath } from "../base/QBasePath.js";
import { identityFormatter } from "./IdentityFormatter.js";

export class QGuidPath<ConvertedType = string> extends QBasePath<string, ConvertedType> {
  protected formatValue = identityFormatter;
}
