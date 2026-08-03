import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV2, MediaEntityServiceV2, ODataService, ODataServiceOptions } from "@odata2ts/odata-service";
// @ts-ignore
import type { QEBook } from "./QTester.js";
// @ts-ignore
import { qEBook, QEBookId } from "./QTester.js";
// @ts-ignore
import type { EBook, EBookId, EditableEBook } from "./TesterModel.js";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  public eBooks(): EBookCollectionService<ClientType>;
  public eBooks(id: EBookId): EBookService<ClientType>;
  public eBooks(id?: EBookId | undefined) {
    const fieldName = "EBooks";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new EBookCollectionService(client, path, fieldName, options)
      : new EBookService(client, path, new QEBookId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }
}

export class EBookService<in out ClientType extends ODataHttpClient> extends MediaEntityServiceV2<
  ClientType,
  EBook,
  EditableEBook,
  QEBook
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qEBook, options);
  }
}

export class EBookCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV2<
  ClientType,
  EBook,
  EditableEBook,
  QEBook,
  EBookId
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qEBook, new QEBookId(name), options);
  }
}
