import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { EntitySetServiceV4, EntityTypeServiceV4 } from "@odata2ts/odata-service";

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

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook);
  }

  public async like(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<ODataModelResponseV4<void>> {
    if (!this._qLike) {
      this._qLike = new QLike();
    }

    const url = this.addFullPath(this._qLike.buildUrl());
    return this.client.post(url, {}, requestConfig);
  }

  public async postReview(
    params: PostReviewParams,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV4<Review>> {
    if (!this._qPostReview) {
      this._qPostReview = new QPostReview();
    }

    const url = this.addFullPath(this._qPostReview.buildUrl());
    const response = await this.client.post(url, this._qPostReview.convertUserParams(params), requestConfig);
    return this._qPostReview.convertResponse(response);
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
