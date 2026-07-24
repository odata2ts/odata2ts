import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
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
import { Book_QBestReview, Book_QFilterReviews, qBook, QBookId } from "./QTester.js";
// @ts-ignore
import type { Book, Book_FilterReviewsParams, BookId, EditableBook, Review } from "./TesterModel.js";

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

export class BookService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _bookQBestReview?: Book_QBestReview;

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qBook, options);
  }

  public bestReview() {
    if (!this._bookQBestReview) {
      this._bookQBestReview = new Book_QBestReview();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._bookQBestReview.buildUrl(isUrlNotEncoded()));

    return new UrlGetRequestCmd<ClientType, ODataModelResponseV4<Review>>(client, url, {
      headers: getDefaultHeaders(),
      mainResponseConverter: this._bookQBestReview.getResponseConverter(),
    });
  }
}

export class BookCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook,
  BookId
> {
  private _bookQFilterReviews?: Book_QFilterReviews;

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qBook, new QBookId(name), options);
  }

  public filterReviews(params: Book_FilterReviewsParams) {
    if (!this._bookQFilterReviews) {
      this._bookQFilterReviews = new Book_QFilterReviews();
    }

    const { addFullPath, client, getDefaultHeaders, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._bookQFilterReviews.buildUrl(params, isUrlNotEncoded()));

    return new UrlGetRequestCmd<ClientType, ODataCollectionResponseV4<Review>>(client, url, {
      headers: getDefaultHeaders(),
      mainResponseConverter: this._bookQFilterReviews.getResponseConverter(),
    });
  }
}
