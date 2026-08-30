import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV2, MediaEntityServiceV2, ODataService, ODataServiceOptions } from "@odata2ts/odata-service";
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

export class EBookService extends MediaEntityServiceV2<EBook, EditableEBook, QEBook> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qEBook, options);
  }
}

export class EBookCollectionService extends EntitySetServiceV2<EBook, EditableEBook, QEBook, EBookId, EBookService> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qEBook, new QEBookId(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptions | undefined,
  ) {
    return new EBookService(client, path, name, options);
  }
}
