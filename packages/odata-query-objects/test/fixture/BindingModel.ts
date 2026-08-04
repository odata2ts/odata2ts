import {
  QBinding,
  QEntityCollectionPath,
  QEntityPath,
  QId,
  QNumberParam,
  QNumberPath,
  QStringPath,
  QueryObject,
} from "../../src";
import { QParamModel } from "../../src/param/QParamModel";

export interface Author {
  id: number;
  name: string;
}

export type AuthorId = number | { id: number };

export interface Book {
  id?: number;
  author?: EditableAuthor | { "@id": AuthorId } | null;
  relatedAuthors?: Array<EditableAuthor | { "@id": AuthorId }>;
}

export interface EditableAuthor {
  id: number;
  name?: string;
}

export class QAuthor extends QueryObject<Author> {
  public readonly id = new QNumberPath(this.withPrefix("ID"));
  public readonly name = new QStringPath(this.withPrefix("NAME"));
}

export class QAuthorId extends QId<AuthorId> {
  getParams(): Array<QParamModel<any, any>> {
    return [new QNumberParam("ID", "id")];
  }
}

/**
 * The navigation properties are named differently than their OData counterparts on purpose: a binding
 * ends up on the wire by the OData name, while the user states it by the mapped one.
 *
 * One class per notation, since that is what the generator bakes into a query object - the notation is
 * decided at generation time, from the OData version the client targets.
 */
export class QBookV40 extends QueryObject<Book> {
  public readonly id = new QNumberPath(this.withPrefix("ID"));
  public readonly author = new QEntityPath(
    this.withPrefix("Author"),
    () => QAuthor,
    new QBinding(() => new QAuthorId("Authors"), "4.0"),
  );
  public readonly relatedAuthors = new QEntityCollectionPath(
    this.withPrefix("RelatedAuthors"),
    () => QAuthor,
    new QBinding(() => new QAuthorId("Authors"), "4.0"),
  );
}

export class QBookV401 extends QueryObject<Book> {
  public readonly id = new QNumberPath(this.withPrefix("ID"));
  public readonly author = new QEntityPath(
    this.withPrefix("Author"),
    () => QAuthor,
    new QBinding(() => new QAuthorId("Authors"), "4.01"),
  );
  public readonly relatedAuthors = new QEntityCollectionPath(
    this.withPrefix("RelatedAuthors"),
    () => QAuthor,
    new QBinding(() => new QAuthorId("Authors"), "4.01"),
  );
}

export class QBookV2 extends QueryObject<Book> {
  public readonly id = new QNumberPath(this.withPrefix("ID"));
  public readonly author = new QEntityPath(
    this.withPrefix("Author"),
    () => QAuthor,
    new QBinding(() => new QAuthorId("Authors"), "V2"),
  );
  public readonly relatedAuthors = new QEntityCollectionPath(
    this.withPrefix("RelatedAuthors"),
    () => QAuthor,
    new QBinding(() => new QAuthorId("Authors"), "V2"),
  );
}
