import { QueryObject } from "../QueryObject";
import { QModelCollectionBasePath } from "./QModelCollectionBasePath";

export class QComplexCollectionPath<Q extends QueryObject> extends QModelCollectionBasePath<Q> {
  private discriminator = "ComplexCollection";
}
