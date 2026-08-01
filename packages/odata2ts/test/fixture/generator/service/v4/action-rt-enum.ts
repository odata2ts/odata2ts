import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataHttpMethods } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV4, ODataModelResponseV4, ODataVersionV4 } from "@odata2ts/odata-core";
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
import { Book_QLike, Book_QRate, BookCollection_QRatings, qBook, QBookId } from "./QTester.js";
import type {
  Book,
  Book_RateParams,
  BookCollection_RatingsParams,
  BookId,
  EditableBook,
  Rating,
  // @ts-ignore
} from "./TesterModel.js";

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

export class BookService<
  in out ClientType extends ODataHttpClient,
  V extends ODataVersionV4 = "4.0",
> extends EntityTypeServiceV4<ClientType, Book, EditableBook, QBook, V> {
  private _bookQLike?: Book_QLike;
  private _bookQRate?: Book_QRate;

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
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

export class BookCollectionService<
  in out ClientType extends ODataHttpClient,
  V extends ODataVersionV4 = "4.0",
> extends EntitySetServiceV4<ClientType, Book, EditableBook, QBook, BookId, V> {
  private _bookCollectionQRatings?: BookCollection_QRatings;

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qBook, new QBookId(name), options);
  }

  public ratings(params: BookCollection_RatingsParams) {
    if (!this._bookCollectionQRatings) {
      this._bookCollectionQRatings = new BookCollection_QRatings();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._bookCollectionQRatings.buildUrl());

    return new UrlRequestCmd<ClientType, ODataCollectionResponseV4<Rating>, BookCollection_RatingsParams>(
      client,
      ODataHttpMethods.Post,
      url,
      params,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: this._bookCollectionQRatings.getRequestConverter(),
        mainResponseConverter: this._bookCollectionQRatings.getResponseConverter(),
      },
    );
  }
}
