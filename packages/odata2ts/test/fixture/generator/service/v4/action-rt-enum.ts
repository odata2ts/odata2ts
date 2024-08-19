import type { HttpResponseModel, ODataHttpClient, ODataHttpClientConfig } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import type { QBook } from "./QTester";
// @ts-ignore
import { Book_QLike, Book_QRate, Book_QRatings, QBookId, qBook } from "./QTester";
// @ts-ignore
import type { Book, BookId, Book_RateParams, Book_RatingsParams, EditableBook, Rating } from "./TesterModel";

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
  private _bookQLike?: Book_QLike;
  private _bookQRate?: Book_QRate;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook);
  }

  public async like(
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): Promise<HttpResponseModel<ODataModelResponseV4<void>>> {
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
  ): Promise<HttpResponseModel<ODataModelResponseV4<Rating>>> {
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
}

export class BookCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook,
  BookId
> {
  private _bookQRatings?: Book_QRatings;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook, new QBookId(name));
  }

  public async ratings(
    params: Book_RatingsParams,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): Promise<HttpResponseModel<ODataCollectionResponseV4<Rating>>> {
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
