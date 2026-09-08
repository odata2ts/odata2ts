import {
  QBinding,
  QEntityCollectionPath,
  QEntityPath,
  QGuidParam,
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

/**
 * A GUID-keyed author, for the batch-reference case. A request reference (`$<id>`) is a string, so it only
 * type-checks against a string key type - which is what a bind to a GUID-keyed entity is. The number-keyed
 * `Author` above could never state one.
 */
export type GuidAuthorId = string;

export interface GuidAuthor {
  id: string;
  name: string;
}

export class QGuidAuthor extends QueryObject<GuidAuthor> {
  public readonly id = new QStringPath(this.withPrefix("ID"));
  public readonly name = new QStringPath(this.withPrefix("NAME"));
}

export class QGuidAuthorId extends QId<GuidAuthorId> {
  getParams(): Array<QParamModel<any, any>> {
    return [new QGuidParam("ID", "id")];
  }
}

export interface GuidBook {
  id?: string;
  author?: { "@id": GuidAuthorId } | null;
}

export class QGuidBookV40 extends QueryObject<GuidBook> {
  public readonly id = new QStringPath(this.withPrefix("ID"));
  public readonly author = new QEntityPath(
    this.withPrefix("Author"),
    () => QGuidAuthor,
    new QBinding(() => new QGuidAuthorId("Authors"), "4.0"),
  );
}

export class QGuidBookV401 extends QueryObject<GuidBook> {
  public readonly id = new QStringPath(this.withPrefix("ID"));
  public readonly author = new QEntityPath(
    this.withPrefix("Author"),
    () => QGuidAuthor,
    new QBinding(() => new QGuidAuthorId("Authors"), "4.01"),
  );
}

export class QGuidBookV2 extends QueryObject<GuidBook> {
  public readonly id = new QStringPath(this.withPrefix("ID"));
  public readonly author = new QEntityPath(
    this.withPrefix("Author"),
    () => QGuidAuthor,
    new QBinding(() => new QGuidAuthorId("Authors"), "V2"),
  );
}
