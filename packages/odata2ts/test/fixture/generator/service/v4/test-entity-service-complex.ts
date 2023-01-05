import { ODataClient } from "@odata2ts/odata-client-api";
import { CollectionServiceV4, EntitySetServiceV4, EntityTypeServiceV4 } from "@odata2ts/odata-service";

// @ts-ignore
import { QBook, QBookId, QReviewer, qBook, qReviewer } from "../QTester";
// @ts-ignore
import { Book, BookId, EditableBook, EditableReviewer, Reviewer } from "../TesterModel";
// @ts-ignore
import { ReviewerService } from "./ReviewerService";

export class BookService<ClientType extends ODataClient> extends EntityTypeServiceV4<
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

  public navToLector(): ReviewerService<ClientType> {
    if (!this._lector) {
      this._lector = new ReviewerService(this.client, this.getPath(), "lector");
    }

    return this._lector;
  }

  public navToReviewers(): CollectionServiceV4<ClientType, Reviewer, QReviewer, EditableReviewer> {
    if (!this._reviewers) {
      this._reviewers = new CollectionServiceV4(this.client, this.getPath(), "reviewers", qReviewer);
    }

    return this._reviewers;
  }
}

export class BookCollectionService<ClientType extends ODataClient> extends EntitySetServiceV4<
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
