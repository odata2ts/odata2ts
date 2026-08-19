import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV2, MediaEntityServiceV2, ODataService, ODataServiceOptions } from "@odata2ts/odata-service";
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

export class EBookService extends MediaEntityServiceV2<EBook, UpdatableEBook, QEBook> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qEBook, options);
  }
}

export class EBookCollectionService extends EntitySetServiceV2<EBook, EditableEBook, QEBook, EBookId> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qEBook, new QEBookId(name), options);
  }
}
