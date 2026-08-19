import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV4, ODataModelResponseV4, ODataVersionV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
  UrlGetRequestCmd,
} from "@odata2ts/odata-service";
import type { QBook } from "./QTester.js";
import { Book_QBestReview, BookCollection_QFilterReviews, qBook, QBookId } from "./QTester.js";
import type {
  Book,
  BookCollection_FilterReviewsParams,
  BookId,
  EditableBook,
  Review,
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

export class BookService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<Book, UpdatableBook, QBook, V> {
  private _bookQBestReview?: Book_QBestReview;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qBook, options);
  }

  public bestReview() {
    if (!this._bookQBestReview) {
      this._bookQBestReview = new Book_QBestReview();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._bookQBestReview.buildUrl(isUrlNotEncoded()));

    return new UrlGetRequestCmd<ODataModelResponseV4<Review>>(client, url, {
      headers: getDefaultHeaders(),
      mainResponseConverter: this._bookQBestReview.getResponseConverter(),
    });
  }
}

export class BookCollectionService<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  Book,
  EditableBook,
  QBook,
  BookId,
  V
> {
  private _bookCollectionQFilterReviews?: BookCollection_QFilterReviews;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qBook, new QBookId(name), options);
  }

  public filterReviews(params: BookCollection_FilterReviewsParams) {
    if (!this._bookCollectionQFilterReviews) {
      this._bookCollectionQFilterReviews = new BookCollection_QFilterReviews();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._bookCollectionQFilterReviews.buildUrl(params, isUrlNotEncoded()));

    return new UrlGetRequestCmd<ODataCollectionResponseV4<Review>>(client, url, {
      headers: getDefaultHeaders(),
      mainResponseConverter: this._bookCollectionQFilterReviews.getResponseConverter(),
    });
  }
}
