import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { Book_QLike, Book_QRate, Book_QRatings, QBook, QBookId, qBook } from "./QTester";
// @ts-ignore
import { Book, BookId, Book_RateParams, Book_RatingsParams, EditableBook, Rating } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {}

export class BookService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _bookQLike?: Book_QLike;
  private _bookQRate?: Book_QRate;
  private _bookQRatings?: Book_QRatings;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook);
  }

  public async like(requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<ODataModelResponseV4<void>> {
    if (!this._bookQLike) {
      this._bookQLike = new Book_QLike();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._bookQLike.buildUrl());
    return client.post(url, {}, requestConfig, getDefaultHeaders());
  }

  public async rate(
    params: Book_RateParams,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV4<Rating>> {
    if (!this._bookQRate) {
      this._bookQRate = new Book_QRate();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._bookQRate.buildUrl());
    const response = await client.post(
      url,
      this._bookQRate.convertUserParams(params),
      requestConfig,
      getDefaultHeaders()
    );
    return this._bookQRate.convertResponse(response);
  }

  public async ratings(
    params: Book_RatingsParams,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV4<Rating>> {
    if (!this._bookQRatings) {
      this._bookQRatings = new Book_QRatings();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._bookQRatings.buildUrl());
    const response = await client.post(
      url,
      this._bookQRatings.convertUserParams(params),
      requestConfig,
      getDefaultHeaders()
    );
    return this._bookQRatings.convertResponse(response);
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
