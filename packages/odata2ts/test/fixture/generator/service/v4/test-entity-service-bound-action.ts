import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { EntitySetServiceV4, EntityTypeServiceV4 } from "@odata2ts/odata-service";

// @ts-ignore
import { QBook, QBookId, QLike, QRate, QRatings, qBook } from "../QTester";
// @ts-ignore
import { Book, BookId, EditableBook, RateParams, Rating, RatingsParams } from "../TesterModel";

export class BookService<ClientType extends ODataClient> extends EntityTypeServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _qLike?: QLike;
  private _qRate?: QRate;
  private _qRatings?: QRatings;

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

  public async rate(
    params: RateParams,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV4<Rating>> {
    if (!this._qRate) {
      this._qRate = new QRate();
    }

    const url = this.addFullPath(this._qRate.buildUrl());
    const response = await this.client.post(url, this._qRate.convertUserParams(params), requestConfig);
    return this._qRate.convertResponse(response);
  }

  public async ratings(
    params: RatingsParams,
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV4<Rating>> {
    if (!this._qRatings) {
      this._qRatings = new QRatings();
    }

    const url = this.addFullPath(this._qRatings.buildUrl());
    const response = await this.client.post(url, this._qRatings.convertUserParams(params), requestConfig);
    return this._qRatings.convertResponse(response);
  }
}

export class BookCollectionService<ClientType extends ODataClient> extends EntitySetServiceV4<
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
