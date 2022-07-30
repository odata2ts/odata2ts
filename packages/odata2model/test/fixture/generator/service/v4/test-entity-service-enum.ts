import { QEnumCollection, qEnumCollection, EnumCollection } from "@odata2ts/odata-query-objects";
import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV4, CollectionServiceV4, EntitySetServiceV4 } from "@odata2ts/odata-service";
// @ts-ignore
import { Book, EditableBook, Choice } from "../TesterModel";
// @ts-ignore
import { QBook, qBook } from "../QTester";

export class BookService extends EntityTypeServiceV4<Book, EditableBook, QBook> {
  private _altChoices?: CollectionServiceV4<EnumCollection<Choice>, QEnumCollection>;

  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public get altChoices() {
    if (!this._altChoices) {
      this._altChoices = new CollectionServiceV4(this.client, this.path + "/altChoices", qEnumCollection);
    }

    return this._altChoices;
  }
}

export class BookCollectionService extends EntitySetServiceV4<
  Book,
  EditableBook,
  QBook,
  string | { id: string },
  BookService
> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qBook, BookService, [{ isLiteral: false, name: "id", odataName: "id" }]);
  }
}
