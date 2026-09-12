import { QueryObject } from "../QueryObject";
import { QModelBasePath } from "./QModelBasePath";

/** The discriminator of a Q-object property path that leads to another single entity - as opposed to a complex value or a primitive property/collection. */
export const ENTITY_PATH_DISCRIMINATOR = "EntityType";

export class QEntityPath<Q extends QueryObject> extends QModelBasePath<Q> {
  public readonly discriminator = ENTITY_PATH_DISCRIMINATOR;
}
