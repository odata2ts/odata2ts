import { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataService, PrimitiveTypeServiceV4 } from "@odata2ts/odata-service";

// @ts-ignore
import { QAuthor, QAuthorId, QBook, QBookId, qAuthor, qBook } from "./QTester";
// @ts-ignore
import { Author, AuthorId, Book, BookId, EditableAuthor, EditableBook } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {}

export class AuthorService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  Author,
  EditableAuthor,
  QAuthor
> {
  private _id?: PrimitiveTypeServiceV4<ClientType, string>;
  private _name?: PrimitiveTypeServiceV4<ClientType, string>;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qAuthor);
  }

  public id() {
    if (!this._id) {
      const { client, path, qModel } = this.__base;
      this._id = new PrimitiveTypeServiceV4(client, path, "ID", qModel.id.converter);
    }

    return this._id;
  }

  public name() {
    if (!this._name) {
      const { client, path, qModel } = this.__base;
      this._name = new PrimitiveTypeServiceV4(client, path, "name", qModel.name.converter);
    }

    return this._name;
  }
}

export class AuthorCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  Author,
  EditableAuthor,
  QAuthor,
  AuthorId
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qAuthor, new QAuthorId(name));
  }
}

export class BookService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _id?: PrimitiveTypeServiceV4<ClientType, string>;
  private _author?: AuthorService<ClientType>;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook);
  }

  public id() {
    if (!this._id) {
      const { client, path, qModel } = this.__base;
      this._id = new PrimitiveTypeServiceV4(client, path, "ID", qModel.id.converter);
    }

    return this._id;
  }

  public author(): AuthorService<ClientType> {
    if (!this._author) {
      const { client, path } = this.__base;
      this._author = new AuthorService(client, path, "AUTHOR");
    }

    return this._author;
  }

  public relatedAuthors(): AuthorCollectionService<ClientType>;
  public relatedAuthors(id: AuthorId): AuthorService<ClientType>;
  public relatedAuthors(id?: AuthorId | undefined) {
    const fieldName = "RelatedAuthors";
    const { client, path } = this.__base;
    return typeof id === "undefined" || id === null
      ? new AuthorCollectionService(client, path, fieldName)
      : new AuthorService(client, path, new QAuthorId(fieldName).buildUrl(id));
  }
}

export class BookCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook,
  BookId
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook, new QBookId(name));
  }
}
