import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { EnumCollection } from "@odata2ts/odata-query-objects";
import { QNumericEnumCollection } from "@odata2ts/odata-query-objects";
import { CollectionServiceV4, EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";
// @ts-ignore
import type { QBook } from "./QTester";
// @ts-ignore
import { qBook, QBookId } from "./QTester";
// @ts-ignore
import type { Book, BookId, EditableBook } from "./TesterModel";
// @ts-ignore
import { Choice } from "./TesterModel";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  public books(): BookCollectionService<ClientType>;
  public books(id: BookId): BookService<ClientType>;
  public books(id?: BookId | undefined) {
    const fieldName = "books";
    const { client, path } = this.__base;
    return typeof id === "undefined" || id === null
      ? new BookCollectionService(client, path, fieldName)
      : new BookService(client, path, new QBookId(fieldName).buildUrl(id));
  }
}

export class BookService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _altChoices?: CollectionServiceV4<ClientType, EnumCollection<Choice>, QNumericEnumCollection<Choice>>;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook);
  }

  public altChoices() {
    if (!this._altChoices) {
      const { client, path } = this.__base;
      this._altChoices = new CollectionServiceV4(client, path, "altChoices", new QNumericEnumCollection(Choice));
    }

    return this._altChoices;
  }
}

export class BookCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV4<
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
