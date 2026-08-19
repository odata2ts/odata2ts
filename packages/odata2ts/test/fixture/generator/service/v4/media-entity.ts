import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataVersionV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  MediaEntityServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
} from "@odata2ts/odata-service";
import type { QEBook } from "./QTester.js";
import { qEBook, QEBookId } from "./QTester.js";
import type { EBook, EBookId, EditableEBook, UpdatableEBook } from "./TesterModel.js";

export class TesterService extends ODataService {
  public eBooks(): EBookCollectionService;
  public eBooks(id: EBookId): EBookService;
  public eBooks(id?: EBookId | undefined) {
    const fieldName = "EBooks";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new EBookCollectionService(client, path, fieldName, options)
      : new EBookService(client, path, new QEBookId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }
}

export class EBookService<V extends ODataVersionV4 = "4.0"> extends MediaEntityServiceV4<
  EBook,
  UpdatableEBook,
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
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qEBook, new QEBookId(name), options);
  }
}
