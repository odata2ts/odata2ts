import { QueryObject, QGuidPath, QEnumPath, QCollectionPath, QEnumCollection } from "@odata2ts/odata-query-objects";

export class QBook extends QueryObject {
  public readonly id = new QGuidPath(this.withPrefix("id"));
  public readonly myChoice = new QEnumPath(this.withPrefix("myChoice"));
  public readonly otherChoices = new QCollectionPath(this.withPrefix("otherChoices"), () => QEnumCollection);

  constructor(path?: string) {
    super(path);
  }
}

export const qBook = new QBook();
