import { QBasePath } from "../base/QBasePath";
import { identityFormatter } from "./IdentityFormatter";

export class QGuidPath<ConvertedType = string> extends QBasePath<string, ConvertedType> {
  protected formatValue = identityFormatter;
}
