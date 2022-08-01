import { QEnumCollection, qEnumCollection, EnumCollection } from "@odata2ts/odata-query-objects";
import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV2, CollectionServiceV2, EntitySetServiceV2 } from "@odata2ts/odata-service";
// @ts-ignore
import { Book, EditableBook, Choice } from "../TesterModel";
// @ts-ignore
import { QBook, qBook } from "../QTester";

export class BookService extends EntityTypeServiceV2<Book, EditableBook, QBook> {
  private _altChoicesSrv?: CollectionServiceV2<EnumCollection<Choice>, QEnumCollection>;

  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public getAltChoicesSrv() {
    if (!this._altChoicesSrv) {
      this._altChoicesSrv = new CollectionServiceV2(this.client, this.path + "/altChoices", qEnumCollection);
    }

    return this._altChoicesSrv;
  }
}

export class BookCollectionService extends EntitySetServiceV2<
  Book,
  EditableBook,
  QBook,
  string | { id: string },
  BookService
> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qBook, BookService, [{ isLiteral: false, type: "string", name: "id", odataName: "id" }]);
  }
}
