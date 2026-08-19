import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataVersionV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
  PrimitiveTypeServiceV4,
} from "@odata2ts/odata-service";
import type { QAuthor, QBook } from "./QTester.js";
import { qAuthor, QAuthorId, qBook, QBookId } from "./QTester.js";
import type {
  Author,
  AuthorId,
  Book,
  BookId,
  EditableAuthor,
  EditableBook,
  UpdatableAuthor,
  UpdatableBook,
} from "./TesterModel.js";

export class TesterService extends ODataService {
  public books(): BookCollectionService;
  public books(id: BookId): BookService;
  public books(id?: BookId | undefined) {
    const fieldName = "books";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new BookCollectionService(client, path, fieldName, options)
      : new BookService(client, path, new QBookId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }
}

export class AuthorService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  Author,
  UpdatableAuthor,
  QAuthor,
  V
> {
  private _id?: PrimitiveTypeServiceV4<string, V>;
  private _name?: PrimitiveTypeServiceV4<string, V>;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
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

export class AuthorCollectionService<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  Author,
  EditableAuthor,
  QAuthor,
  AuthorId,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qAuthor, new QAuthorId(name), options);
  }
}

export class BookService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<Book, UpdatableBook, QBook, V> {
  private _id?: PrimitiveTypeServiceV4<string, V>;
  private _author?: AuthorService<V>;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qBook, options);
  }

  public id() {
    if (!this._id) {
      const { client, path, qModel, options } = this.__base;
      this._id = new PrimitiveTypeServiceV4(client, path, "ID", qModel.id.converter, options);
    }

    return this._id;
  }

  public author(): AuthorService<V> {
    if (!this._author) {
      const { client, path, options } = this.__base;
      this._author = new AuthorService(client, path, "AUTHOR", options);
    }

    return this._author;
  }

  public relatedAuthors(): AuthorCollectionService<V>;
  public relatedAuthors(id: AuthorId): AuthorService<V>;
  public relatedAuthors(id?: AuthorId | undefined) {
    const fieldName = "RelatedAuthors";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new AuthorCollectionService(client, path, fieldName, options)
      : new AuthorService(client, path, new QAuthorId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }
}

export class BookCollectionService<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  Book,
  EditableBook,
  QBook,
  BookId,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qBook, new QBookId(name), options);
  }
}
