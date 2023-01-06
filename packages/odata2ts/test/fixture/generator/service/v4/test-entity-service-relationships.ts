import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityServiceResolver, EntitySetServiceV4, EntityTypeServiceV4 } from "@odata2ts/odata-service";

// @ts-ignore
import { QBook, QBookId, qBook } from "../QTester";
// @ts-ignore
import { Book, BookId, EditableBook } from "../TesterModel";
// @ts-ignore
import { AuthorCollectionService, AuthorService } from "./AuthorService";

export class BookService<ClientType extends ODataClient> extends EntityTypeServiceV4<
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

  public navToAuthor(): AuthorService<ClientType> {
    if (!this._author) {
      this._author = new AuthorService(this.client, this.getPath(), "author");
    }

    return this._author;
  }

  public navToRelatedAuthors(): AuthorCollectionService<ClientType> {
    if (!this._relatedAuthors) {
      this._relatedAuthors = new AuthorCollectionService(this.client, this.getPath(), "relatedAuthors");
    }

    return this._relatedAuthors;
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

export function createBookServiceResolver(client: ODataClient, basePath: string, entityName: string) {
  return new EntityServiceResolver(client, basePath, entityName, QBookId, BookService, BookCollectionService);
}
