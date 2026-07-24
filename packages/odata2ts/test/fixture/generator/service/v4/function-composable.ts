import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import {
  ComposableUrlRequestCmd,
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QBook, QReview } from "./QTester.js";
// @ts-ignore
import { qBook, QBookId, QGetBest, QGetBestReview, QGetTop10, qReview } from "./QTester.js";
// @ts-ignore
import type { Book, BookId, EditableBook, EditableReview, Review } from "./TesterModel.js";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qGetBest?: QGetBest;
  private _qGetTop10?: QGetTop10;
  private _qGetBestReview?: QGetBestReview;

  public books(): BookCollectionService<ClientType>;
  public books(id: BookId): BookService<ClientType>;
  public books(id?: BookId | undefined) {
    const fieldName = "Books";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new BookCollectionService(client, path, fieldName, options)
      : new BookService(client, path, new QBookId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }

  public bestBook() {
    if (!this._qGetBest) {
      this._qGetBest = new QGetBest();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded, options } = this.__base;
    const url = addFullPath(this._qGetBest.buildUrl(isUrlNotEncoded()));

    return new ComposableUrlRequestCmd<ClientType, BookService<ClientType>, ODataModelResponseV4<Book>>(
      client,
      url,
      (finalUrl: string) => new BookService<ClientType>(client, finalUrl, "", options),
      { headers: getDefaultHeaders(), mainResponseConverter: this._qGetBest.getResponseConverter() },
    );
  }

  public top10() {
    if (!this._qGetTop10) {
      this._qGetTop10 = new QGetTop10();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded, options } = this.__base;
    const url = addFullPath(this._qGetTop10.buildUrl(isUrlNotEncoded()));

    return new ComposableUrlRequestCmd<ClientType, BookCollectionService<ClientType>, ODataCollectionResponseV4<Book>>(
      client,
      url,
      (finalUrl: string) => new BookCollectionService<ClientType>(client, finalUrl, "", options),
      { headers: getDefaultHeaders(), mainResponseConverter: this._qGetTop10.getResponseConverter() },
    );
  }

  public bestReview() {
    if (!this._qGetBestReview) {
      this._qGetBestReview = new QGetBestReview();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded, options } = this.__base;
    const url = addFullPath(this._qGetBestReview.buildUrl(isUrlNotEncoded()));

    return new ComposableUrlRequestCmd<ClientType, ReviewService<ClientType>, ODataModelResponseV4<Review>>(
      client,
      url,
      (finalUrl: string) => new ReviewService<ClientType>(client, finalUrl, "", options),
      { headers: getDefaultHeaders(), mainResponseConverter: this._qGetBestReview.getResponseConverter() },
    );
  }
}

export class BookService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _review?: ReviewService<ClientType>;

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qBook, options);
  }

  public review(): ReviewService<ClientType> {
    if (!this._review) {
      const { client, path, options } = this.__base;
      this._review = new ReviewService(client, path, "review", options);
    }

    return this._review;
  }
}

export class BookCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook,
  BookId
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qBook, new QBookId(name), options);
  }
}

export class ReviewService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  Review,
  EditableReview,
  QReview
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qReview, options);
  }
}
