import type { ODataHttpClient } from "@odata2ts/http-client-api";
import {
  CollectionServiceV2,
  ComplexTypeServiceV2,
  EntitySetServiceV2,
  EntityTypeServiceV2,
  ODataService,
  ODataServiceOptions,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QBook, QReviewer } from "./QTester.js";
// @ts-ignore
import { qBook, QBookId, qReviewer } from "./QTester.js";
// @ts-ignore
import type { Book, BookId, EditableBook, EditableReviewer, Reviewer } from "./TesterModel.js";

export class TesterService extends ODataService {
  public books(): BookCollectionService;
  public books(id: BookId): BookService;
  public books(id?: BookId | undefined) {
    const fieldName = "Books";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new BookCollectionService(client, path, fieldName, options)
      : new BookService(client, path, new QBookId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }
}

export class BookService extends EntityTypeServiceV2<Book, EditableBook, QBook> {
  private _lector?: ReviewerService;
  private _reviewers?: CollectionServiceV2<Reviewer, QReviewer, EditableReviewer>;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qBook, options);
  }

  public lector(): ReviewerService {
    if (!this._lector) {
      const { client, path, options } = this.__base;
      this._lector = new ReviewerService(client, path, "lector", options);
    }

    return this._lector;
  }

  public reviewers(): CollectionServiceV2<Reviewer, QReviewer, EditableReviewer> {
    if (!this._reviewers) {
      const { client, path, options } = this.__base;
      this._reviewers = new CollectionServiceV2(client, path, "reviewers", qReviewer, options);
    }

    return this._reviewers;
  }
}

export class BookCollectionService extends EntitySetServiceV2<Book, EditableBook, QBook, BookId> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qBook, new QBookId(name), options);
  }
}

export class ReviewerService extends ComplexTypeServiceV2<Reviewer, EditableReviewer, QReviewer> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qReviewer, options);
  }
}
