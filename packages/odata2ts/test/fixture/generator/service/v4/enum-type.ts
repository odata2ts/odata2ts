import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataVersionV4 } from "@odata2ts/odata-core";
import type { EnumCollection } from "@odata2ts/odata-query-objects";
import { QEnumCollection } from "@odata2ts/odata-query-objects";
import {
  CollectionServiceV4,
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
  PrimitiveExtractor,
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
    const { client, path, options } = this.__base;
    const collection = new BookCollectionService(client, path, fieldName, options);
    return typeof id === "undefined" || id === null ? collection : collection.byId(id);
  }
}

export class BookService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<Book, EditableBook, QBook, V> {
  private _altChoices?: CollectionServiceV4<
    EnumCollection<typeof Choice>,
    QEnumCollection<typeof Choice>,
    PrimitiveExtractor<EnumCollection<typeof Choice>>,
    V
  >;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qBook, options);
  }

  public altChoices() {
    if (!this._altChoices) {
      const { client, path, options } = this.__base;
      this._altChoices = new CollectionServiceV4(client, path, "altChoices", new QEnumCollection(Choice), options);
    }

    return this._altChoices;
  }
}

export class BookCollectionService<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  Book,
  EditableBook,
  QBook,
  BookId,
  BookService<V>,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qBook, new QBookId(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternal<V> | undefined,
  ) {
    return new BookService<V>(client, path, name, options);
  }
}
