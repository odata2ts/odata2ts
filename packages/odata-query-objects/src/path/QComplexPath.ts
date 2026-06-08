import { QueryObject } from "../QueryObject";
import { QModelBasePath } from "./QModelBasePath";

export class QComplexPath<Q extends QueryObject> extends QModelBasePath<Q> {
  private discriminator = "ComplexType";
}
