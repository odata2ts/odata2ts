import type { ODataHttpClient } from "@odata2ts/http-client-api";
import {
  ComplexTypeServiceV2,
  EntitySetServiceV2,
  EntityTypeServiceV2,
  ODataService,
  ODataServiceOptions,
  ODataServiceOptionsInternalV2,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QBook, QReviewer } from "./QTester.js";
// @ts-ignore
import { qBook, QBookId, qReviewer } from "./QTester.js";
// @ts-ignore
import type { Book, BookId, EditableBook, EditableReviewer, Reviewer } from "./TesterModel.js";

export class TesterService extends ODataService {
  constructor(client: ODataHttpClient, basePath: string, options?: ODataServiceOptions) {
    super(client, basePath, { ...options, v2ResponseAsV4: true } as any);
  }

  public books(): BookCollectionService<true>;
  public books(id: BookId): BookService<true>;
  public books(id?: BookId | undefined) {
    const fieldName = "Books";
    const { client, path, options } = this.__base;
    const collection = new BookCollectionService<true>(client, path, fieldName, options);
    return typeof id === "undefined" || id === null ? collection : collection.byId(id);
  }
}

export class BookService<AsV4 extends boolean = false> extends EntityTypeServiceV2<Book, EditableBook, QBook, AsV4> {
  private _lector?: ReviewerService<AsV4>;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternalV2<AsV4>) {
    super(client, basePath, name, qBook, options);
  }

  public lector(): ReviewerService<AsV4> {
    if (!this._lector) {
      const { client, path, options } = this.__base;
      this._lector = new ReviewerService(client, path, "lector", options);
    }

    return this._lector;
  }
}

export class BookCollectionService<AsV4 extends boolean = false> extends EntitySetServiceV2<
  Book,
  EditableBook,
  QBook,
  BookId,
  BookService<AsV4>,
  AsV4
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternalV2<AsV4>) {
    super(client, basePath, name, qBook, new QBookId(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternalV2<AsV4> | undefined,
  ) {
    return new BookService<AsV4>(client, path, name, options);
  }
}

export class ReviewerService<AsV4 extends boolean = false> extends ComplexTypeServiceV2<
  Reviewer,
  EditableReviewer,
  QReviewer,
  AsV4
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternalV2<AsV4>) {
    super(client, basePath, name, qReviewer, options);
  }
}
