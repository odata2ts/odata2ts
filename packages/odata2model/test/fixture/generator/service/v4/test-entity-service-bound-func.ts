import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataCollectionResponseV4,
  ODataModelResponseV4,
} from "@odata2ts/odata-service";

// @ts-ignore
import { QBestReview, QBook, QBookId, QFilterReviews, qBook } from "../QTester";
// @ts-ignore
import { Book, BookId, EditableBook, FilterReviewsParams, Review } from "../TesterModel";

export class BookService<ClientType extends ODataClient> extends EntityTypeServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _qBestReview?: QBestReview;
  private _qFilterReviews?: QFilterReviews;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook);
  }

  public bestReview(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<ODataModelResponseV4<string>> {
    if (!this._qBestReview) {
      this._qBestReview = new QBestReview();
    }

    const url = this.addFullPath(this._qBestReview.buildUrl());
    return this.client.get(url, requestConfig);
  }

  public filterReviews(
    params: FilterReviewsParams,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV4<Review>> {
    if (!this._qFilterReviews) {
      this._qFilterReviews = new QFilterReviews();
    }

    const url = this.addFullPath(this._qFilterReviews.buildUrl(params));
    return this.client.get(url, requestConfig);
  }
}

export class BookCollectionService<ClientType extends ODataClient> extends EntitySetServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook,
  BookId,
  BookService<ClientType>
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook, BookService, new QBookId(name));
  }
}
