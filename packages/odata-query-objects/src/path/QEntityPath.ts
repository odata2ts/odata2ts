import { QueryObject } from "../QueryObject";
import { QModelBasePath } from "./QModelBasePath";

export class QEntityPath<Q extends QueryObject> extends QModelBasePath<Q> {
  private discriminator = "EntityType";
}
