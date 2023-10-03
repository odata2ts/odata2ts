import { ODataHttpClient } from "@odata2ts/http-client-api";
import { CollectionServiceV2, EntitySetServiceV2, EntityTypeServiceV2, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QBook, QBookId, QReviewer, qBook, qReviewer } from "./QTester";
// @ts-ignore
import { Book, BookId, EditableBook, EditableReviewer, Reviewer } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {}

export class BookService<ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _lector?: ReviewerService<ClientType>;
  private _reviewers?: CollectionServiceV2<ClientType, Reviewer, QReviewer, EditableReviewer>;

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

  public reviewers(): CollectionServiceV2<ClientType, Reviewer, QReviewer, EditableReviewer> {
    if (!this._reviewers) {
      const { client, path } = this.__base;
      this._reviewers = new CollectionServiceV2(client, path, "reviewers", qReviewer);
    }

    return this._reviewers;
  }
}

export class BookCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV2<
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

export class ReviewerService<ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  Reviewer,
  EditableReviewer,
  QReviewer
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qReviewer);
  }
}
