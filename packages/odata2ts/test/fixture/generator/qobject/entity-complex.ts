import { QBooleanPath, QComplexCollectionPath, QComplexPath, QueryObject } from "@odata2ts/odata-query-objects";

export class QBook extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
  public readonly method = new QComplexPath(this.withPrefix("method"), () => QPublishingMethod);
  public readonly altMethod = new QComplexPath(this.withPrefix("altMethod"), () => QPublishingMethod);
  public readonly altMethods = new QComplexCollectionPath(this.withPrefix("altMethods"), () => QPublishingMethod);
}

export const qBook = new QBook();

export class QPublishingMethod extends QueryObject {
  public readonly name = new QBooleanPath(this.withPrefix("name"));
  public readonly city = new QComplexPath(this.withPrefix("city"), () => QCity);
}

export const qPublishingMethod = new QPublishingMethod();

export class QCity extends QueryObject {
  public readonly choice = new QBooleanPath(this.withPrefix("choice"));
  public readonly optChoice = new QBooleanPath(this.withPrefix("optChoice"));
}

export const qCity = new QCity();
