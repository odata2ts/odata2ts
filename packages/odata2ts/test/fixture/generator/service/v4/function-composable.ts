import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV4, ODataModelResponseV4, ODataVersionV4 } from "@odata2ts/odata-core";
import {
  ComposableUrlRequestCmd,
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
} from "@odata2ts/odata-service";
import type { QBook, QReview } from "./QTester.js";
import { qBook, QBookId, QGetBest, QGetBestReview, QGetTop10, qReview } from "./QTester.js";
import type { Book, BookId, EditableBook, EditableReview, Review, UpdatableBook } from "./TesterModel.js";

export class TesterService extends ODataService {
  private _qGetBest?: QGetBest;
  private _qGetTop10?: QGetTop10;
  private _qGetBestReview?: QGetBestReview;

  public books(): BookCollectionService;
  public books(id: BookId): BookService;
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

    return new ComposableUrlRequestCmd<BookService, ODataModelResponseV4<Book>>(
      client,
      url,
      (finalUrl: string) => new BookService(client, finalUrl, "", options),
      { headers: getDefaultHeaders(), mainResponseConverter: this._qGetBest.getResponseConverter() },
    );
  }

  public top10() {
    if (!this._qGetTop10) {
      this._qGetTop10 = new QGetTop10();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded, options } = this.__base;
    const url = addFullPath(this._qGetTop10.buildUrl(isUrlNotEncoded()));

    return new ComposableUrlRequestCmd<BookCollectionService, ODataCollectionResponseV4<Book>>(
      client,
      url,
      (finalUrl: string) => new BookCollectionService(client, finalUrl, "", options),
      { headers: getDefaultHeaders(), mainResponseConverter: this._qGetTop10.getResponseConverter() },
    );
  }

  public bestReview() {
    if (!this._qGetBestReview) {
      this._qGetBestReview = new QGetBestReview();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded, options } = this.__base;
    const url = addFullPath(this._qGetBestReview.buildUrl(isUrlNotEncoded()));

    return new ComposableUrlRequestCmd<ReviewService, ODataModelResponseV4<Review>>(
      client,
      url,
      (finalUrl: string) => new ReviewService(client, finalUrl, "", options),
      { headers: getDefaultHeaders(), mainResponseConverter: this._qGetBestReview.getResponseConverter() },
    );
  }
}

export class BookService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<Book, UpdatableBook, QBook, V> {
  private _review?: ReviewService<V>;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qBook, options);
  }

  public review(): ReviewService<V> {
    if (!this._review) {
      const { client, path, options } = this.__base;
      this._review = new ReviewService(client, path, "review", options);
    }

    return this._review;
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

export class ReviewService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  Review,
  EditableReview,
  QReview,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qReview, options);
  }
}
