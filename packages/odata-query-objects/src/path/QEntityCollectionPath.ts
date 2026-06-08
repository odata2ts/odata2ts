import { QueryObject } from "../QueryObject";
import { QModelCollectionBasePath } from "./QModelCollectionBasePath";

export class QEntityCollectionPath<Q extends QueryObject> extends QModelCollectionBasePath<Q> {
  private discriminator = "EntitySet";
}
