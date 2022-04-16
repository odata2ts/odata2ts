// @ts-nocheck
import { QEnumCollection, qEnumCollection, EnumCollection } from "@odata2ts/odata-query-objects";
import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeService, CollectionService, EntitySetService, compileId } from "@odata2ts/odata-service";
import { Book, Choice } from "../TesterModel";
import { QBook, qBook } from "../QTester";

export class BookService extends EntityTypeService<Book, QBook> {
  private _altChoices?: CollectionService<EnumCollection<Choice>, QEnumCollection>;

  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public get altChoices() {
    if (!this._altChoices) {
      this._altChoices = new CollectionService(this.client, this.path + "/altChoices", qEnumCollection);
    }

    return this._altChoices;
  }
}

export class BookCollectionService extends EntitySetService<Book, QBook, string | { id: string }> {
  private keySpec = [{ isLiteral: false, name: "id", odataName: "id" }];

  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public getKeySpec() {
    return this.keySpec;
  }

  public get(id: string | { id: string }): BookService {
    const url = compileId(this.path, this.keySpec, id);
    return new BookService(this.client, url);
  }
}
