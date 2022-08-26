import { QEnumCollection, qEnumCollection, EnumCollection } from "@odata2ts/odata-query-objects";
import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV4, CollectionServiceV4, EntitySetServiceV4 } from "@odata2ts/odata-service";
// @ts-ignore
import { Book, EditableBook, Choice } from "../TesterModel";
// @ts-ignore
import { QBook, qBook } from "../QTester";

export class BookService<ClientType extends ODataClient> extends EntityTypeServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _altChoicesSrv?: CollectionServiceV4<ClientType, EnumCollection<Choice>, QEnumCollection>;

  constructor(client: ClientType, path: string) {
    super(client, path, qBook);
  }

  public getAltChoicesSrv() {
    if (!this._altChoicesSrv) {
      this._altChoicesSrv = new CollectionServiceV4(this.client, this.path + "/altChoices", qEnumCollection);
    }

    return this._altChoicesSrv;
  }
}

export class BookCollectionService<ClientType extends ODataClient> extends EntitySetServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook,
  string | { id: string },
  BookService<ClientType>
> {
  constructor(client: ClientType, path: string) {
    super(client, path, qBook, BookService, [{ isLiteral: false, type: "string", name: "id", odataName: "id" }]);
  }
}
