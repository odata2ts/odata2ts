import { ODataClient } from "@odata2ts/odata-client-api";
import { EnumCollection, QEnumCollection, qEnumCollection } from "@odata2ts/odata-query-objects";
import { CollectionServiceV2, EntitySetServiceV2, EntityTypeServiceV2 } from "@odata2ts/odata-service";

// @ts-ignore
import { QBook, QBookId, qBook } from "../QTester";
// @ts-ignore
import { Book, BookId, Choice, EditableBook } from "../TesterModel";

export class BookService<ClientType extends ODataClient> extends EntityTypeServiceV2<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _altChoicesSrv?: CollectionServiceV2<ClientType, EnumCollection<Choice>, QEnumCollection>;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook);
  }

  public getAltChoicesSrv() {
    if (!this._altChoicesSrv) {
      this._altChoicesSrv = new CollectionServiceV2(this.client, this.getPath(), "altChoices", qEnumCollection);
    }

    return this._altChoicesSrv;
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
