import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataModelResponseV4 } from "@odata2ts/odata-service";

// @ts-ignore
import { QBestReview, QBook, QBookId, qBook } from "../QTester";
// @ts-ignore
import { Book, BookId, EditableBook } from "../TesterModel";

export class BookService<ClientType extends ODataClient> extends EntityTypeServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook);
  }
}

export class BookCollectionService<ClientType extends ODataClient> extends EntitySetServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook,
  BookId,
  BookService<ClientType>
> {
  private _qBestReview?: QBestReview;

  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qBook, BookService, new QBookId(name));
  }

  public bestReview(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<ODataModelResponseV4<string>> {
    if (!this._qBestReview) {
      this._qBestReview = new QBestReview();
    }

    const url = this.addFullPath(this._qBestReview.buildUrl());
    return this.client.get(url, requestConfig);
  }
}
