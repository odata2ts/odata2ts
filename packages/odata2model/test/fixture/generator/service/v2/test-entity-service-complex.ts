import { ODataClient } from "@odata2ts/odata-client-api";
import { CollectionServiceV2, EntitySetServiceV2, EntityTypeServiceV2 } from "@odata2ts/odata-service";

// @ts-ignore
import { QBook, QBookId, QReviewer, qBook, qReviewer } from "../QTester";
// @ts-ignore
import { Book, BookId, EditableBook, EditableReviewer, Reviewer } from "../TesterModel";
// @ts-ignore
import { ReviewerService } from "./ReviewerService";

export class BookService<ClientType extends ODataClient> extends EntityTypeServiceV2<
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

  public getLectorSrv(): ReviewerService<ClientType> {
    if (!this._lector) {
      this._lector = new ReviewerService(this.client, this.getPath(), "lector");
    }

    return this._lector;
  }

  public getReviewersSrv(): CollectionServiceV2<ClientType, Reviewer, QReviewer, EditableReviewer> {
    if (!this._reviewers) {
      this._reviewers = new CollectionServiceV2(this.client, this.getPath(), "reviewers", qReviewer);
    }

    return this._reviewers;
  }
}

export class BookCollectionService<ClientType extends ODataClient> extends EntitySetServiceV2<
  ClientType,
  Book,
  EditableBook,
  QBook,
  BookId,
  BookService<ClientType>
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook, BookService, new QBookId(name));
  }
}
