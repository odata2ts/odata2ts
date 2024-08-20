import type { HttpResponseModel, ODataHttpClient, ODataHttpClientConfig } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";
// @ts-ignore
import type { QBook } from "./QTester";
// @ts-ignore
import { Book_QBestReview, Book_QFilterReviews, qBook, QBookId } from "./QTester";
// @ts-ignore
import type { Book, Book_FilterReviewsParams, BookId, EditableBook, Review } from "./TesterModel";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  public books(): BookCollectionService<ClientType>;
  public books(id: BookId): BookService<ClientType>;
  public books(id?: BookId | undefined) {
    const fieldName = "books";
    const { client, path } = this.__base;
    return typeof id === "undefined" || id === null
      ? new BookCollectionService(client, path, fieldName)
      : new BookService(client, path, new QBookId(fieldName).buildUrl(id));
  }
}

export class BookService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _bookQBestReview?: Book_QBestReview;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook);
  }

  public async bestReview(
    requestConfig?: ODataHttpClientConfig<ClientType>,
  ): Promise<HttpResponseModel<ODataModelResponseV4<Review>>> {
    if (!this._bookQBestReview) {
      this._bookQBestReview = new Book_QBestReview();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._bookQBestReview.buildUrl());
    const response = await client.get(url, requestConfig, getDefaultHeaders());
    return this._bookQBestReview.convertResponse(response);
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

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook, new QBookId(name));
  }

  public async filterReviews(
    params: Book_FilterReviewsParams,
    requestConfig?: ODataHttpClientConfig<ClientType>,
  ): Promise<HttpResponseModel<ODataCollectionResponseV4<Review>>> {
    if (!this._bookQFilterReviews) {
      this._bookQFilterReviews = new Book_QFilterReviews();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._bookQFilterReviews.buildUrl(params));
    const response = await client.get(url, requestConfig, getDefaultHeaders());
    return this._bookQFilterReviews.convertResponse(response);
  }
}
