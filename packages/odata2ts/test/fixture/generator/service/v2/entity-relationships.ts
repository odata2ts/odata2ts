import type { ODataHttpClient } from "@odata2ts/http-client-api";
import {
  EntitySetServiceV2,
  EntityTypeServiceV2,
  ODataService,
  ODataServiceOptions,
  PrimitiveTypeServiceV2,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QAuthor, QBook } from "./QTester";
// @ts-ignore
import { qAuthor, QAuthorId, qBook, QBookId } from "./QTester";
// @ts-ignore
import type { Author, AuthorId, Book, BookId, EditableAuthor, EditableBook } from "./TesterModel";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  public books(): BookCollectionService<ClientType>;
  public books(id: BookId): BookService<ClientType>;
  public books(id?: BookId | undefined) {
    const fieldName = "books";
    const { client, path, options } = this.__base;
    return typeof id === "undefined" || id === null
      ? new BookCollectionService(client, path, fieldName, options)
      : new BookService(client, path, new QBookId(fieldName).buildUrl(id), options);
  }
}

export class AuthorService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  Author,
  EditableAuthor,
  QAuthor
> {
  private _id?: PrimitiveTypeServiceV2<ClientType, string>;
  private _name?: PrimitiveTypeServiceV2<ClientType, string>;

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qAuthor, options);
  }

  public id() {
    if (!this._id) {
      const { client, path, qModel, options } = this.__base;
      this._id = new PrimitiveTypeServiceV2(client, path, "ID", qModel.id.converter, "id", options);
    }

    return this._id;
  }

  public name() {
    if (!this._name) {
      const { client, path, qModel, options } = this.__base;
      this._name = new PrimitiveTypeServiceV2(client, path, "name", qModel.name.converter, undefined, options);
    }

    return this._name;
  }
}

export class AuthorCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV2<
  ClientType,
  Author,
  EditableAuthor,
  QAuthor,
  AuthorId
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qAuthor, new QAuthorId(name), options);
  }
}

export class BookService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _id?: PrimitiveTypeServiceV2<ClientType, string>;
  private _author?: AuthorService<ClientType>;

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qBook, options);
  }

  public id() {
    if (!this._id) {
      const { client, path, qModel, options } = this.__base;
      this._id = new PrimitiveTypeServiceV2(client, path, "ID", qModel.id.converter, "id", options);
    }

    return this._id;
  }

  public author(): AuthorService<ClientType> {
    if (!this._author) {
      const { client, path, options } = this.__base;
      this._author = new AuthorService(client, path, "author", options);
    }

    return this._author;
  }

  public relatedAuthors(): AuthorCollectionService<ClientType>;
  public relatedAuthors(id: AuthorId): AuthorService<ClientType>;
  public relatedAuthors(id?: AuthorId | undefined) {
    const fieldName = "relatedAuthors";
    const { client, path, options } = this.__base;
    return typeof id === "undefined" || id === null
      ? new AuthorCollectionService(client, path, fieldName, options)
      : new AuthorService(client, path, new QAuthorId(fieldName).buildUrl(id), options);
  }
}

export class BookCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV2<
  ClientType,
  Book,
  EditableBook,
  QBook,
  BookId
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qBook, new QBookId(name), options);
  }
}
