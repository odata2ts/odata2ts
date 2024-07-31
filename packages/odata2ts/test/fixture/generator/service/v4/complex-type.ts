import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { CollectionServiceV4, EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QBook, QBookId, QReviewer, qBook, qReviewer } from "./QTester";
// @ts-ignore
import type { Book, BookId, EditableBook, EditableReviewer, Reviewer } from "./TesterModel";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  public books(): BookCollectionService<ClientType>;
  public books(id: BookId): BookService<ClientType>;
  public books(id?: BookId | undefined) {
    const fieldName = "Books";
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
  private _lector?: ReviewerService<ClientType>;
  private _reviewers?: CollectionServiceV4<ClientType, Reviewer, QReviewer, EditableReviewer>;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook);
  }

  public lector(): ReviewerService<ClientType> {
    if (!this._lector) {
      const { client, path } = this.__base;
      this._lector = new ReviewerService(client, path, "lector");
    }

    return this._lector;
  }

  public reviewers(): CollectionServiceV4<ClientType, Reviewer, QReviewer, EditableReviewer> {
    if (!this._reviewers) {
      const { client, path } = this.__base;
      this._reviewers = new CollectionServiceV4(client, path, "reviewers", qReviewer);
    }

    return this._reviewers;
  }
}

export class BookCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV4<
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

export class ReviewerService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  Reviewer,
  EditableReviewer,
  QReviewer
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qReviewer);
  }
}
