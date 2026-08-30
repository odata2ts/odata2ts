import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataVersionV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  MediaEntityServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QEBook } from "./QTester.js";
// @ts-ignore
import { qEBook, QEBookId } from "./QTester.js";
// @ts-ignore
import type { EBook, EBookId, EditableEBook } from "./TesterModel.js";

export class TesterService extends ODataService {
  public eBooks(): EBookCollectionService;
  public eBooks(id: EBookId): EBookService;
  public eBooks(id?: EBookId | undefined) {
    const fieldName = "EBooks";
    const { client, path, options } = this.__base;
    const collection = new EBookCollectionService(client, path, fieldName, options);
    return typeof id === "undefined" || id === null ? collection : collection.byId(id);
  }
}

export class EBookService<V extends ODataVersionV4 = "4.0"> extends MediaEntityServiceV4<
  EBook,
  EditableEBook,
  QEBook,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qEBook, options);
  }
}

export class EBookCollectionService<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  EBook,
  EditableEBook,
  QEBook,
  EBookId,
  EBookService<V>,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qEBook, new QEBookId(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternal<V> | undefined,
  ) {
    return new EBookService<V>(client, path, name, options);
  }
}
