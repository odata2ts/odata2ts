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
  private _author?: AuthorService<ClientType>;
  private _relatedAuthors?: AuthorCollectionService<ClientType>;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook);
  }

  public getAuthorSrv(): AuthorService<ClientType> {
    if (!this._author) {
      this._author = new AuthorService(this.client, this.getPath(), "author");
    }

    return this._author;
  }

  public getRelatedAuthorsSrv(): AuthorCollectionService<ClientType> {
    if (!this._relatedAuthors) {
      this._relatedAuthors = new AuthorCollectionService(this.client, this.getPath(), "relatedAuthors");
    }

    return this._relatedAuthors;
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
