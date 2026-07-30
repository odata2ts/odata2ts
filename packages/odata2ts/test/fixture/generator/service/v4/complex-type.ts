import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataVersionV4 } from "@odata2ts/odata-core";
import {
  CollectionServiceV4,
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QBook, QReviewer } from "./QTester.js";
// @ts-ignore
import { qBook, QBookId, qReviewer } from "./QTester.js";
// @ts-ignore
import type { Book, BookId, EditableBook, EditableReviewer, Reviewer } from "./TesterModel.js";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  public books(): BookCollectionService<ClientType>;
  public books(id: BookId): BookService<ClientType>;
  public books(id?: BookId | undefined) {
    const fieldName = "Books";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new BookCollectionService(client, path, fieldName, options)
      : new BookService(client, path, new QBookId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }
}

export class BookService<
  in out ClientType extends ODataHttpClient,
  V extends ODataVersionV4 = "4.0",
> extends EntityTypeServiceV4<ClientType, Book, EditableBook, QBook, V> {
  private _lector?: ReviewerService<ClientType, V>;
  private _reviewers?: CollectionServiceV4<ClientType, Reviewer, QReviewer, EditableReviewer, V>;

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qBook, options);
  }

  public lector(): ReviewerService<ClientType, V> {
    if (!this._lector) {
      const { client, path, options } = this.__base;
      this._lector = new ReviewerService(client, path, "lector", options);
    }

    return this._lector;
  }

  public reviewers(): CollectionServiceV4<ClientType, Reviewer, QReviewer, EditableReviewer, V> {
    if (!this._reviewers) {
      const { client, path, options } = this.__base;
      this._reviewers = new CollectionServiceV4(client, path, "reviewers", qReviewer, options);
    }

    return this._reviewers;
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

export class ReviewerService<
  in out ClientType extends ODataHttpClient,
  V extends ODataVersionV4 = "4.0",
> extends EntityTypeServiceV4<ClientType, Reviewer, EditableReviewer, QReviewer, V> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qReviewer, options);
  }
}
