import { QueryObject } from "../QueryObject";
import { QModelCollectionBasePath } from "./QModelCollectionBasePath";

/** The discriminator of a Q-object property path that leads to a collection of entities - as opposed to a complex value or a primitive property/collection. */
export const ENTITY_COLLECTION_PATH_DISCRIMINATOR = "EntitySet";

export class QEntityCollectionPath<Q extends QueryObject> extends QModelCollectionBasePath<Q> {
  public readonly discriminator = ENTITY_COLLECTION_PATH_DISCRIMINATOR;
}
