import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV4, CollectionServiceV4, EntitySetServiceV4 } from "@odata2ts/odata-service";
// @ts-ignore
import { Book, Reviewer } from "../TesterModel";
// @ts-ignore
import { QBook, qBook, QReviewer, qReviewer } from "../QTester";
// @ts-ignore
import { ReviewerService } from "./ReviewerService";

export class BookService extends EntityTypeServiceV4<Book, QBook> {
  private _lector?: ReviewerService;
  private _reviewers?: CollectionServiceV4<Reviewer, QReviewer>;

  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public get lector(): ReviewerService {
    if (!this._lector) {
      this._lector = new ReviewerService(this.client, this.path + "/lector");
    }

    return this._lector;
  }

  public get reviewers(): CollectionServiceV4<Reviewer, QReviewer> {
    if (!this._reviewers) {
      this._reviewers = new CollectionServiceV4<Reviewer, QReviewer>(this.client, this.path + "/reviewers", qReviewer);
    }

    return this._reviewers;
  }
}

export class BookCollectionService extends EntitySetServiceV4<Book, QBook, string | { id: string }, BookService> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qBook, BookService, [{ isLiteral: false, name: "id", odataName: "id" }]);
  }
}