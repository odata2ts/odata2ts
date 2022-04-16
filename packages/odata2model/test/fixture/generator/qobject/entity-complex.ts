import { QueryObject, QStringPath, QEntityPath, QEntityCollectionPath } from "@odata2ts/odata-query-objects";

export class QBook extends QueryObject {
  public readonly id = new QStringPath(this.withPrefix("id"));
  public readonly method = new QEntityPath(this.withPrefix("method"), () => QPublishingMethod);
  public readonly altMethods = new QEntityCollectionPath(this.withPrefix("altMethods"), () => QPublishingMethod);

  constructor(path?: string) {
    super(path);
  }
}

export const qBook = new QBook();

export class QPublishingMethod extends QueryObject {
  public readonly name = new QStringPath(this.withPrefix("name"));

  constructor(path?: string) {
    super(path);
  }
}

export const qPublishingMethod = new QPublishingMethod();
