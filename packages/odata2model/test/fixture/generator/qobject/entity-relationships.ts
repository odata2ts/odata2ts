import { QueryObject, QStringPath, QEntityPath, QEntityCollectionPath } from "@odata2ts/odata-query-objects";

export class QAuthor extends QueryObject {
  public readonly id = new QStringPath(this.withPrefix("id"));
  public readonly name = new QStringPath(this.withPrefix("name"));

  constructor(path?: string) {
    super(path);
  }
}

export const qAuthor = new QAuthor();

export class QBook extends QueryObject {
  public readonly id = new QStringPath(this.withPrefix("id"));
  public readonly author = new QEntityPath(this.withPrefix("author"), () => QAuthor);
  public readonly relatedAuthors = new QEntityCollectionPath(this.withPrefix("relatedAuthors"), () => QAuthor);

  constructor(path?: string) {
    super(path);
  }
}

export const qBook = new QBook();