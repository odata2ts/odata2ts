import {
  QBooleanPath,
  QEntityCollectionPath,
  QEntityPath,
  QNumberPath,
  QueryObject,
} from "@odata2ts/odata-query-objects";

export class QAuthor extends QueryObject {
  public readonly id = new QNumberPath(this.withPrefix("id"));
  public readonly name = new QBooleanPath(this.withPrefix("name"));
}

export const qAuthor = new QAuthor();

export class QBook extends QueryObject {
  public readonly id = new QNumberPath(this.withPrefix("id"));
  public readonly author = new QEntityPath(this.withPrefix("author"), () => QAuthor);
  public readonly altAuthor = new QEntityPath(this.withPrefix("altAuthor"), () => QAuthor);
  public readonly relatedAuthors = new QEntityCollectionPath(this.withPrefix("relatedAuthors"), () => QAuthor);
}

export const qBook = new QBook();
