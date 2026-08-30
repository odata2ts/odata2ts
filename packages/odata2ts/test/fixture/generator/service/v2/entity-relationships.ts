import type { ODataHttpClient } from "@odata2ts/http-client-api";
import {
  EntitySetServiceV2,
  EntityTypeServiceV2,
  ODataService,
  ODataServiceOptions,
  PrimitiveTypeServiceV2,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QAuthor, QBook } from "./QTester.js";
// @ts-ignore
import { qAuthor, QAuthorId, qBook, QBookId } from "./QTester.js";
// @ts-ignore
import type { Author, AuthorId, Book, BookId, EditableAuthor, EditableBook } from "./TesterModel.js";

export class TesterService extends ODataService {
  public books(): BookCollectionService;
  public books(id: BookId): BookService;
  public books(id?: BookId | undefined) {
    const fieldName = "books";
    const { client, path, options } = this.__base;
    const collection = new BookCollectionService(client, path, fieldName, options);
    return typeof id === "undefined" || id === null ? collection : collection.byId(id);
  }
}

export class AuthorService extends EntityTypeServiceV2<Author, EditableAuthor, QAuthor> {
  private _id?: PrimitiveTypeServiceV2<string>;
  private _name?: PrimitiveTypeServiceV2<string>;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
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

export class AuthorCollectionService extends EntitySetServiceV2<
  Author,
  EditableAuthor,
  QAuthor,
  AuthorId,
  AuthorService
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qAuthor, new QAuthorId(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptions | undefined,
  ) {
    return new AuthorService(client, path, name, options);
  }
}

export class BookService extends EntityTypeServiceV2<Book, EditableBook, QBook> {
  private _id?: PrimitiveTypeServiceV2<string>;
  private _author?: AuthorService;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qBook, options);
  }

  public id() {
    if (!this._id) {
      const { client, path, qModel, options } = this.__base;
      this._id = new PrimitiveTypeServiceV2(client, path, "ID", qModel.id.converter, "id", options);
    }

    return this._id;
  }

  public author(): AuthorService {
    if (!this._author) {
      const { client, path, options } = this.__base;
      this._author = new AuthorService(client, path, "author", options);
    }

    return this._author;
  }

  public relatedAuthors(): AuthorCollectionService;
  public relatedAuthors(id: AuthorId): AuthorService;
  public relatedAuthors(id?: AuthorId | undefined) {
    const fieldName = "relatedAuthors";
    const { client, path, options } = this.__base;
    const collection = new AuthorCollectionService(client, path, fieldName, options);
    return typeof id === "undefined" || id === null ? collection : collection.byId(id);
  }
}

export class BookCollectionService extends EntitySetServiceV2<Book, EditableBook, QBook, BookId, BookService> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qBook, new QBookId(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptions | undefined,
  ) {
    return new BookService(client, path, name, options);
  }
}
