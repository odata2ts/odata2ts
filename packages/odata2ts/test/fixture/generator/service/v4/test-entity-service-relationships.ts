import { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV4, EntityTypeServiceV4, PrimitiveTypeServiceV4 } from "@odata2ts/odata-service";

// @ts-ignore
import { QAuthorId, QBook, QBookId, qBook } from "../QTester";
// @ts-ignore
import { AuthorId, Book, BookId, EditableBook } from "../TesterModel";
// @ts-ignore
import { AuthorCollectionService, AuthorService } from "./AuthorService";

export class BookService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _id?: PrimitiveTypeServiceV4<ClientType, string>;
  private _author?: AuthorService<ClientType>;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook);
  }

  public id() {
    if (!this._id) {
      this._id = new PrimitiveTypeServiceV4(this.client, this.getPath(), "ID");
    }

    return this._id;
  }

  public author(): AuthorService<ClientType> {
    if (!this._author) {
      this._author = new AuthorService(this.client, this.getPath(), "AUTHOR");
    }

    return this._author;
  }

  public relatedAuthors(): AuthorCollectionService<ClientType>;
  public relatedAuthors(id: AuthorId): AuthorService<ClientType>;
  public relatedAuthors(id?: AuthorId | undefined) {
    const fieldName = "RelatedAuthors";
    return typeof id === "undefined" || id === null
      ? new AuthorCollectionService(this.client, this.getPath(), fieldName)
      : new AuthorService(this.client, this.getPath(), new QAuthorId(fieldName).buildUrl(id));
  }
}

export class BookCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook,
  BookId
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook, new QBookId(name));
  }
}
