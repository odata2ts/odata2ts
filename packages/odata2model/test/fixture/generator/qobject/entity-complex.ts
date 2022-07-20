import {
  QueryObject,
  QNumberPath,
  QEntityPath,
  QEntityCollectionPath,
  QBooleanPath,
} from "@odata2ts/odata-query-objects";

export class QBook extends QueryObject {
  public readonly id = new QNumberPath(this.withPrefix("id"));
  public readonly method = new QEntityPath(this.withPrefix("method"), () => QPublishingMethod);
  public readonly altMethods = new QEntityCollectionPath(this.withPrefix("altMethods"), () => QPublishingMethod);

  constructor(path?: string) {
    super(path);
  }
}

export const qBook = new QBook();

export class QPublishingMethod extends QueryObject {
  public readonly name = new QBooleanPath(this.withPrefix("name"));

  constructor(path?: string) {
    super(path);
  }
}

export const qPublishingMethod = new QPublishingMethod();
