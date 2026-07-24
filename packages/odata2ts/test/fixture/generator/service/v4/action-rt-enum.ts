import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataHttpMethods } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
  UrlRequestCmd,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QBook } from "./QTester.js";
// @ts-ignore
import { Book_QLike, Book_QRate, Book_QRatings, qBook, QBookId } from "./QTester.js";
// @ts-ignore
import type { Book, Book_RateParams, Book_RatingsParams, BookId, EditableBook, Rating } from "./TesterModel.js";

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
  private _bookQLike?: Book_QLike;
  private _bookQRate?: Book_QRate;

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qBook, options);
  }

  public like() {
    if (!this._bookQLike) {
      this._bookQLike = new Book_QLike();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._bookQLike.buildUrl());

    return new UrlRequestCmd<ClientType, undefined>(client, ODataHttpMethods.Post, url, undefined, {
      headers: getDefaultHeaders(),
    });
  }

  public rate(params: Book_RateParams) {
    if (!this._bookQRate) {
      this._bookQRate = new Book_QRate();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._bookQRate.buildUrl());

    return new UrlRequestCmd<ClientType, ODataModelResponseV4<Rating>, Book_RateParams>(
      client,
      ODataHttpMethods.Post,
      url,
      params,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: this._bookQRate.getRequestConverter(),
        mainResponseConverter: this._bookQRate.getResponseConverter(),
      },
    );
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

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qBook, new QBookId(name), options);
  }

  public ratings(params: Book_RatingsParams) {
    if (!this._bookQRatings) {
      this._bookQRatings = new Book_QRatings();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._bookQRatings.buildUrl());

    return new UrlRequestCmd<ClientType, ODataCollectionResponseV4<Rating>, Book_RatingsParams>(
      client,
      ODataHttpMethods.Post,
      url,
      params,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: this._bookQRatings.getRequestConverter(),
        mainResponseConverter: this._bookQRatings.getResponseConverter(),
      },
    );
  }
}
