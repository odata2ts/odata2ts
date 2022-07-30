import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV2, EntitySetServiceV2 } from "@odata2ts/odata-service";
// @ts-ignore
import { Book, EditableBook } from "../TesterModel";
// @ts-ignore
import { QBook, qBook } from "../QTester";
// @ts-ignore
import { AuthorService, AuthorCollectionService } from "./AuthorService";

export class BookService extends EntityTypeServiceV2<Book, EditableBook, QBook> {
  private _author?: AuthorService;
  private _relatedAuthors?: AuthorCollectionService;

  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public get author(): AuthorService {
    if (!this._author) {
      this._author = new AuthorService(this.client, this.path + "/author");
    }

    return this._author;
  }

  public get relatedAuthors(): AuthorCollectionService {
    if (!this._relatedAuthors) {
      this._relatedAuthors = new AuthorCollectionService(this.client, this.path + "/relatedAuthors");
    }

    return this._relatedAuthors;
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
    super(client, path, qBook, BookService, [{ isLiteral: true, name: "id", odataName: "ID" }]);
  }
}
