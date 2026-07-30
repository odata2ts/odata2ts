import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataVersionV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
  PrimitiveTypeServiceV4,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QAuthor, QBook } from "./QTester.js";
// @ts-ignore
import { qAuthor, QAuthorId, qBook, QBookId } from "./QTester.js";
// @ts-ignore
import type { Author, AuthorId, Book, BookId, EditableAuthor, EditableBook } from "./TesterModel.js";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  public books(): BookCollectionService<ClientType>;
  public books(id: BookId): BookService<ClientType>;
  public books(id?: BookId | undefined) {
    const fieldName = "books";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new BookCollectionService(client, path, fieldName, options)
      : new BookService(client, path, new QBookId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }
}

export class AuthorService<
  in out ClientType extends ODataHttpClient,
  V extends ODataVersionV4 = "4.0",
> extends EntityTypeServiceV4<ClientType, Author, EditableAuthor, QAuthor, V> {
  private _id?: PrimitiveTypeServiceV4<ClientType, string, V>;
  private _name?: PrimitiveTypeServiceV4<ClientType, string, V>;

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qAuthor, options);
  }

  public id() {
    if (!this._id) {
      const { client, path, qModel, options } = this.__base;
      this._id = new PrimitiveTypeServiceV4(client, path, "ID", qModel.id.converter, options);
    }

    return this._id;
  }

  public name() {
    if (!this._name) {
      const { client, path, qModel, options } = this.__base;
      this._name = new PrimitiveTypeServiceV4(client, path, "name", qModel.name.converter, options);
    }

    return this._name;
  }
}

export class AuthorCollectionService<
  in out ClientType extends ODataHttpClient,
  V extends ODataVersionV4 = "4.0",
> extends EntitySetServiceV4<ClientType, Author, EditableAuthor, QAuthor, AuthorId, V> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qAuthor, new QAuthorId(name), options);
  }
}

export class BookService<
  in out ClientType extends ODataHttpClient,
  V extends ODataVersionV4 = "4.0",
> extends EntityTypeServiceV4<ClientType, Book, EditableBook, QBook, V> {
  private _id?: PrimitiveTypeServiceV4<ClientType, string, V>;
  private _author?: AuthorService<ClientType, V>;

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qBook, options);
  }

  public id() {
    if (!this._id) {
      const { client, path, qModel, options } = this.__base;
      this._id = new PrimitiveTypeServiceV4(client, path, "ID", qModel.id.converter, options);
    }

    return this._id;
  }

  public author(): AuthorService<ClientType, V> {
    if (!this._author) {
      const { client, path, options } = this.__base;
      this._author = new AuthorService(client, path, "AUTHOR", options);
    }

    return this._author;
  }

  public relatedAuthors(): AuthorCollectionService<ClientType, V>;
  public relatedAuthors(id: AuthorId): AuthorService<ClientType, V>;
  public relatedAuthors(id?: AuthorId | undefined) {
    const fieldName = "RelatedAuthors";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new AuthorCollectionService(client, path, fieldName, options)
      : new AuthorService(client, path, new QAuthorId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }
}

export class BookCollectionService<
  in out ClientType extends ODataHttpClient,
  V extends ODataVersionV4 = "4.0",
> extends EntitySetServiceV4<ClientType, Book, EditableBook, QBook, BookId, V> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qBook, new QBookId(name), options);
  }
}
