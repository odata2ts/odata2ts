import { ODataHttpClient } from "@odata2ts/http-client-api";
import { CollectionServiceV4, EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QBook, QBookId, QReviewer, qBook, qReviewer } from "./QTester";
// @ts-ignore
import { Book, BookId, EditableBook, EditableReviewer, Reviewer } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {}

export class BookService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
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

export class ReviewerService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  Reviewer,
  EditableReviewer,
  QReviewer
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qReviewer);
  }
}
