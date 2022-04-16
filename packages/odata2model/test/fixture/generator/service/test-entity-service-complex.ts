// @ts-nocheck
import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeService, CollectionService, EntitySetService, compileId } from "@odata2ts/odata-service";
import { Book, Reviewer } from "../TesterModel";
import { QBook, qBook, QReviewer, qReviewer } from "../QTester";
import { ReviewerService } from "./ReviewerService";

export class BookService extends EntityTypeService<Book, QBook> {
  private _lector?: ReviewerService;
  private _reviewers?: CollectionService<Reviewer, QReviewer>;

  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public get lector(): ReviewerService {
    if (!this._lector) {
      this._lector = new ReviewerService(this.client, this.path + "/lector");
    }

    return this._lector;
  }

  public get reviewers(): CollectionService<Reviewer, QReviewer> {
    if (!this._reviewers) {
      this._reviewers = new CollectionService<Reviewer, QReviewer>(this.client, this.path + "/reviewers", qReviewer);
    }

    return this._reviewers;
  }
}

export class BookCollectionService extends EntitySetService<Book, QBook, string | { id: string }> {
  private keySpec = [{ isLiteral: false, name: "id", odataName: "id" }];

  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public getKeySpec() {
    return this.keySpec;
  }

  public get(id: string | { id: string }): BookService {
    const url = compileId(this.path, this.keySpec, id);
    return new BookService(this.client, url);
  }
}
