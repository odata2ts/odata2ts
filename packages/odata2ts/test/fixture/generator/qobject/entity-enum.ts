import { QBooleanPath, QCollectionPath, QEnumCollection, QEnumPath, QueryObject } from "@odata2ts/odata-query-objects";

export class QBook extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
  public readonly myChoice = new QEnumPath(this.withPrefix("myChoice"));
  public readonly otherChoices = new QCollectionPath(this.withPrefix("otherChoices"), () => QEnumCollection);
}

export const qBook = new QBook();
