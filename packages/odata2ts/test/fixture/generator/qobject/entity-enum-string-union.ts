import { QBooleanPath, QEnumCollectionPath, QEnumPath, QueryObject } from "@odata2ts/odata-query-objects";
// @ts-ignore
import { Choice } from "./TesterModel";

export class QBook extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
  public readonly myChoice = new QEnumPath(this.withPrefix("myChoice"), Choice);
  public readonly otherChoices = new QEnumCollectionPath(this.withPrefix("otherChoices"), Choice);
}

export const qBook = new QBook();
