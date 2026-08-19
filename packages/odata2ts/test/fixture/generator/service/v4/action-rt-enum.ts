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
import type { QBook } from "./QTester.js";
import { Book_QLike, Book_QRate, BookCollection_QRatings, qBook, QBookId } from "./QTester.js";
import type {
  Book,
  Book_RateParams,
  BookCollection_RatingsParams,
  BookId,
  EditableBook,
  Rating,
  UpdatableBook,
} from "./TesterModel.js";

export class TesterService extends ODataService {
  public books(): BookCollectionService;
  public books(id: BookId): BookService;
  public books(id?: BookId | undefined) {
    const fieldName = "books";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new BookCollectionService(client, path, fieldName, options)
      : new BookService(client, path, new QBookId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }
}

export class BookService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<Book, UpdatableBook, QBook, V> {
  private _bookQLike?: Book_QLike;
  private _bookQRate?: Book_QRate;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qBook, options);
  }

  public like() {
    if (!this._bookQLike) {
      this._bookQLike = new Book_QLike();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._bookQLike.buildUrl());

    return new UrlRequestCmd<undefined>(client, ODataHttpMethods.Post, url, undefined, {
      headers: getDefaultHeaders(),
    });
  }

  public rate(params: Book_RateParams) {
    if (!this._bookQRate) {
      this._bookQRate = new Book_QRate();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._bookQRate.buildUrl());

    return new UrlRequestCmd<ODataModelResponseV4<Rating>, Book_RateParams>(
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

export class BookCollectionService<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  Book,
  EditableBook,
  QBook,
  BookId,
  V
> {
  private _bookCollectionQRatings?: BookCollection_QRatings;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qBook, new QBookId(name), options);
  }

  public ratings(params: BookCollection_RatingsParams) {
    if (!this._bookCollectionQRatings) {
      this._bookCollectionQRatings = new BookCollection_QRatings();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._bookCollectionQRatings.buildUrl());

    return new UrlRequestCmd<ODataCollectionResponseV4<Rating>, BookCollection_RatingsParams>(
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
