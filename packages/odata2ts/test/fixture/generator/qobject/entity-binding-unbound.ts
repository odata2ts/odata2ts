import {
  QEntityCollectionPath,
  QEntityPath,
  QId,
  QNumberParam,
  QNumberPath,
  QueryObject,
} from "@odata2ts/odata-query-objects";
import type { AuthorId, BookId } from "./TesterModel.js";

export class QAuthor extends QueryObject {
  public readonly id = new QNumberPath(this.withPrefix("id"));
}

export const qAuthor = new QAuthor();

export class QAuthorId extends QId<AuthorId> {
  private readonly params = [new QNumberParam("id")];

  getParams() {
    return this.params;
  }
}

export class QBook extends QueryObject {
  public readonly id = new QNumberPath(this.withPrefix("id"));
  public readonly author = new QEntityPath(this.withPrefix("author"), () => QAuthor);
  public readonly relatedAuthors = new QEntityCollectionPath(this.withPrefix("relatedAuthors"), () => QAuthor);
}

export const qBook = new QBook();

export class QBookId extends QId<BookId> {
  private readonly params = [new QNumberParam("id")];

  getParams() {
    return this.params;
  }
}
