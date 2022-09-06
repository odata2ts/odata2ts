import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataModelResponseV4 } from "@odata2ts/odata-service";

// @ts-ignore
import { QBook, QBookId, QLike, QPostReview, qBook } from "../QTester";
// @ts-ignore
import { Book, BookId, EditableBook, PostReviewParams, Review } from "../TesterModel";

export class BookService<ClientType extends ODataClient> extends EntityTypeServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _qLike?: QLike;
  private _qPostReview?: QPostReview;

  constructor(client: ClientType, path: string) {
    super(client, path, qBook);
  }

  private _getQLike() {
    if (!this._qLike) {
      this._qLike = new QLike(this.getPath());
    }

    return this._qLike;
  }

  public like(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<ODataModelResponseV4<void>> {
    const url = this._getQLike().buildUrl();
    return this.client.post(url, {}, requestConfig);
  }

  private _getQPostReview() {
    if (!this._qPostReview) {
      this._qPostReview = new QPostReview(this.getPath());
    }

    return this._qPostReview;
  }

  public postReview(
    params: PostReviewParams,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV4<Review>> {
    const url = this._getQPostReview().buildUrl();
    return this.client.post(url, params, requestConfig);
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
  constructor(client: ClientType, path: string) {
    super(client, path, qBook, BookService, new QBookId(path));
  }
}
