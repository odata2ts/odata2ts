import {
  QueryObject,
  QGuidPath,
  QEntityPath,
  QEntityCollectionPath,
  QBooleanPath,
} from "@odata2ts/odata-query-objects";

export class QBook extends QueryObject {
  public readonly id = new QGuidPath(this.withPrefix("id"));
  public readonly method = new QEntityPath(this.withPrefix("method"), () => QPublishingMethod);
  public readonly altMethod = new QEntityPath(this.withPrefix("altMethod"), () => QPublishingMethod);
  public readonly altMethods = new QEntityCollectionPath(this.withPrefix("altMethods"), () => QPublishingMethod);

  constructor(path?: string) {
    super(path);
  }
}

export const qBook = new QBook();

export class QPublishingMethod extends QueryObject {
  public readonly name = new QBooleanPath(this.withPrefix("name"));
  public readonly city = new QEntityPath(this.withPrefix("city"), () => QCity);

  constructor(path?: string) {
    super(path);
  }
}

export const qPublishingMethod = new QPublishingMethod();

export class QCity extends QueryObject {
  public readonly choice = new QBooleanPath(this.withPrefix("choice"));
  public readonly optChoice = new QBooleanPath(this.withPrefix("optChoice"));

  constructor(path?: string) {
    super(path);
  }
}

export const qCity = new QCity();
