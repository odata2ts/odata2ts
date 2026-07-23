import { QueryObject } from "../QueryObject";
import { QModelBasePath } from "./QModelBasePath";

export class QComplexPath<Q extends QueryObject> extends QModelBasePath<Q> {
  public readonly discriminator = "ComplexType";
}
