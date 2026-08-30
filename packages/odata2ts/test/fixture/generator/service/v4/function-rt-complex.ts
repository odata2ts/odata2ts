import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV4, ODataModelResponseV4, ODataVersionV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
  UrlGetRequestCmd,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QBook } from "./QTester.js";
// @ts-ignore
import { Book_QBestReview, BookCollection_QFilterReviews, qBook, QBookId } from "./QTester.js";
// @ts-ignore
import type { Book, BookCollection_FilterReviewsParams, BookId, EditableBook, Review } from "./TesterModel.js";

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

export class BookService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<Book, EditableBook, QBook, V> {
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
  BookService<V>,
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

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternal<V> | undefined,
  ) {
    return new BookService<V>(client, path, name, options);
  }
}
