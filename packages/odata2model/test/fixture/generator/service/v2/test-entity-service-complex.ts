import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV2, CollectionServiceV2, EntitySetServiceV2 } from "@odata2ts/odata-service";
// @ts-ignore
import { Book, EditableBook, Reviewer, EditableReviewer } from "../TesterModel";
// @ts-ignore
import { QBook, qBook, QReviewer, qReviewer } from "../QTester";
// @ts-ignore
import { ReviewerService } from "./ReviewerService";

export class BookService extends EntityTypeServiceV2<Book, EditableBook, QBook> {
  private _lector?: ReviewerService;
  private _reviewers?: CollectionServiceV2<Reviewer, QReviewer, EditableReviewer>;

  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public get lector(): ReviewerService {
    if (!this._lector) {
      this._lector = new ReviewerService(this.client, this.path + "/lector");
    }

    return this._lector;
  }

  public get reviewers(): CollectionServiceV2<Reviewer, QReviewer, EditableReviewer> {
    if (!this._reviewers) {
      this._reviewers = new CollectionServiceV2<Reviewer, QReviewer, EditableReviewer>(
        this.client,
        this.path + "/reviewers",
        qReviewer
      );
    }

    return this._reviewers;
  }
}

export class BookCollectionService extends EntitySetServiceV2<
  Book,
  EditableBook,
  QBook,
  string | { id: string },
  BookService
> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qBook, BookService, [{ isLiteral: false, type: "string", name: "id", odataName: "id" }]);
  }
}
