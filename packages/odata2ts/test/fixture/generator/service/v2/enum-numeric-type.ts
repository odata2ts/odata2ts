import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { EnumCollection } from "@odata2ts/odata-query-objects";
import { QNumericEnumCollection } from "@odata2ts/odata-query-objects";
import {
  CollectionServiceV2,
  EntitySetServiceV2,
  EntityTypeServiceV2,
  ODataService,
  ODataServiceOptions,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QBook } from "./QTester.js";
// @ts-ignore
import { qBook, QBookId } from "./QTester.js";
// @ts-ignore
import type { Book, BookId, EditableBook } from "./TesterModel.js";
// @ts-ignore
import { Choice } from "./TesterModel.js";

export class TesterService extends ODataService {
  public books(): BookCollectionService;
  public books(id: BookId): BookService;
  public books(id?: BookId | undefined) {
    const fieldName = "books";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new BookCollectionService(client, path, fieldName, options)
      : new BookService(client, path, new QBookId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }
}

export class BookService extends EntityTypeServiceV2<Book, EditableBook, QBook> {
  private _altChoices?: CollectionServiceV2<EnumCollection<typeof Choice>, QNumericEnumCollection<typeof Choice>>;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qBook, options);
  }

  public altChoices() {
    if (!this._altChoices) {
      const { client, path, options } = this.__base;
      this._altChoices = new CollectionServiceV2(
        client,
        path,
        "altChoices",
        new QNumericEnumCollection(Choice),
        options,
      );
    }

    return this._altChoices;
  }
}

export class BookCollectionService extends EntitySetServiceV2<Book, EditableBook, QBook, BookId> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qBook, new QBookId(name), options);
  }
}
