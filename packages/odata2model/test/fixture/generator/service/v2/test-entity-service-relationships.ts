import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV2, EntitySetServiceV2 } from "@odata2ts/odata-service";
// @ts-ignore
import { Book, EditableBook } from "../TesterModel";
// @ts-ignore
import { QBook, qBook } from "../QTester";
// @ts-ignore
import { AuthorService, AuthorCollectionService } from "./AuthorService";

export class BookService extends EntityTypeServiceV2<Book, EditableBook, QBook> {
  private _authorSrv?: AuthorService;
  private _relatedAuthorsSrv?: AuthorCollectionService;

  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public getAuthorSrv(): AuthorService {
    if (!this._authorSrv) {
      this._authorSrv = new AuthorService(this.client, this.path + "/author");
    }

    return this._authorSrv;
  }

  public getRelatedAuthorsSrv(): AuthorCollectionService {
    if (!this._relatedAuthorsSrv) {
      this._relatedAuthorsSrv = new AuthorCollectionService(this.client, this.path + "/relatedAuthors");
    }

    return this._relatedAuthorsSrv;
  }
}

export class BookCollectionService extends EntitySetServiceV2<
  Book,
  EditableBook,
  QBook,
  string | { ID: string },
  BookService
> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qBook, BookService, [
      { isLiteral: false, type: "string", typePrefix: "guid", name: "id", odataName: "ID" },
    ]);
  }
}
