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
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new EBookCollectionService(client, path, fieldName, options)
      : new EBookService(client, path, new QEBookId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
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
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qEBook, new QEBookId(name), options);
  }
}
