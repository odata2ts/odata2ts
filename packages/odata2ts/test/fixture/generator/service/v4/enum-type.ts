import { ODataHttpClient } from "@odata2ts/http-client-api";
import { EnumCollection, QEnumCollection, qEnumCollection } from "@odata2ts/odata-query-objects";
import { CollectionServiceV4, EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QBook, QBookId, qBook } from "./QTester";
// @ts-ignore
import { Book, BookId, Choice, EditableBook } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {}

export class BookService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _altChoices?: CollectionServiceV4<ClientType, EnumCollection<Choice>, QEnumCollection>;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook);
  }

  public altChoices() {
    if (!this._altChoices) {
      const { client, path } = this.__base;
      this._altChoices = new CollectionServiceV4(client, path, "altChoices", qEnumCollection);
    }

    return this._altChoices;
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
