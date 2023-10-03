import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { Book_QBestReview, Book_QFilterReviews, QBook, QBookId, QReview, qBook, qReview } from "./QTester";
// @ts-ignore
import { Book, BookId, Book_FilterReviewsParams, EditableBook, EditableReview, Review } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {}

export class BookService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _bookQBestReview?: Book_QBestReview;
  private _bookQFilterReviews?: Book_QFilterReviews;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook);
  }

  public async bestReview(
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV4<Review>> {
    if (!this._bookQBestReview) {
      this._bookQBestReview = new Book_QBestReview();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._bookQBestReview.buildUrl());
    const response = await client.get(url, requestConfig, getDefaultHeaders());
    return this._bookQBestReview.convertResponse(response);
  }

  public async filterReviews(
    params: Book_FilterReviewsParams,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV4<Review>> {
    if (!this._bookQFilterReviews) {
      this._bookQFilterReviews = new Book_QFilterReviews();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._bookQFilterReviews.buildUrl(params));
    const response = await client.get(url, requestConfig, getDefaultHeaders());
    return this._bookQFilterReviews.convertResponse(response);
  }
}

export class BookCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook,
  BookId
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook, new QBookId(name));
  }
}

export class ReviewService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  Review,
  EditableReview,
  QReview
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qReview);
  }
}
