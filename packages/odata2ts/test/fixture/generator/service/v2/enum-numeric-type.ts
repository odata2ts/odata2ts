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
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new BookCollectionService(client, path, fieldName, options)
      : new BookService(client, path, new QBookId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }
}

export class BookService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  private _altChoices?: CollectionServiceV2<
    ClientType,
    EnumCollection<typeof Choice>,
    QNumericEnumCollection<typeof Choice>
  >;

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptions) {
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

export class BookCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV2<
  ClientType,
  Book,
  EditableBook,
  QBook,
  BookId
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qBook, new QBookId(name), options);
  }
}
