import { ODataClient } from "@odata2ts/odata-client-api";
import { EntitySetServiceV2, EntityTypeServiceV2 } from "@odata2ts/odata-service";

// @ts-ignore
import { QBook, QBookId, qBook } from "../QTester";
// @ts-ignore
import { Book, BookId, EditableBook } from "../TesterModel";
// @ts-ignore
import { AuthorCollectionService, AuthorService } from "./AuthorService";

export class BookService<ClientType extends ODataClient> extends EntityTypeServiceV2<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _authorSrv?: AuthorService<ClientType>;
  private _relatedAuthorsSrv?: AuthorCollectionService<ClientType>;

  constructor(client: ClientType, path: string) {
    super(client, path, qBook);
  }

  public getAuthorSrv(): AuthorService<ClientType> {
    if (!this._authorSrv) {
      this._authorSrv = new AuthorService(this.client, this.path + "/author");
    }

    return this._authorSrv;
  }

  public getRelatedAuthorsSrv(): AuthorCollectionService<ClientType> {
    if (!this._relatedAuthorsSrv) {
      this._relatedAuthorsSrv = new AuthorCollectionService(this.client, this.path + "/relatedAuthors");
    }

    return this._relatedAuthorsSrv;
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
  constructor(client: ClientType, path: string) {
    super(client, path, qBook, BookService, new QBookId(path));
  }
}
