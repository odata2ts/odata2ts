import { ODataHttpClient } from "@odata2ts/http-client-api";
import { EnumCollection, QEnumCollection, qEnumCollection } from "@odata2ts/odata-query-objects";
import { CollectionServiceV2, EntitySetServiceV2, EntityTypeServiceV2, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QBook, QBookId, qBook } from "./QTester";
// @ts-ignore
import { Book, BookId, Choice, EditableBook } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {}

export class BookService<ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _altChoices?: CollectionServiceV2<ClientType, EnumCollection<Choice>, QEnumCollection>;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook);
  }

  public altChoices() {
    if (!this._altChoices) {
      const { client, path } = this.__base;
      this._altChoices = new CollectionServiceV2(client, path, "altChoices", qEnumCollection);
    }

    return this._altChoices;
  }
}

export class BookCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV2<
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
