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
  private _lectorSrv?: ReviewerService<ClientType>;
  private _reviewersSrv?: CollectionServiceV4<ClientType, Reviewer, QReviewer, EditableReviewer>;

  constructor(client: ClientType, path: string) {
    super(client, path, qBook);
  }

  public getLectorSrv(): ReviewerService<ClientType> {
    if (!this._lectorSrv) {
      this._lectorSrv = new ReviewerService(this.client, this.path + "/lector");
    }

    return this._lectorSrv;
  }

  public getReviewersSrv(): CollectionServiceV4<ClientType, Reviewer, QReviewer, EditableReviewer> {
    if (!this._reviewersSrv) {
      this._reviewersSrv = new CollectionServiceV4(this.client, this.path + "/reviewers", qReviewer);
    }

    return this._reviewersSrv;
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
  constructor(client: ClientType, path: string) {
    super(client, path, qBook, BookService, new QBookId(path));
  }
}
