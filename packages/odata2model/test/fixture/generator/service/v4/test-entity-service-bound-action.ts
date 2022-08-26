import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import {
  EntityTypeServiceV4,
  ODataModelResponseV4,
  compileActionPath,
  EntitySetServiceV4,
} from "@odata2ts/odata-service";
// @ts-ignore
import { Book, EditableBook, Review } from "../TesterModel";
// @ts-ignore
import { QBook, qBook } from "../QTester";

export class BookService<ClientType extends ODataClient> extends EntityTypeServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook
> {
  constructor(client: ClientType, path: string) {
    super(client, path, qBook);
  }

  public like(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<ODataModelResponseV4<void>> {
    const url = compileActionPath(this.getPath(), "Tester.like");
    return this.client.post(url, {}, requestConfig);
  }

  public postReview(
    params: { Rating: number; PUBLICATION_DATE?: string },
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataModelResponseV4<Review>> {
    const url = compileActionPath(this.getPath(), "Tester.postReview");
    return this.client.post(url, params, requestConfig);
  }
}

export class BookCollectionService<ClientType extends ODataClient> extends EntitySetServiceV4<
  ClientType,
  Book,
  EditableBook,
  QBook,
  string | { id: string },
  BookService<ClientType>
> {
  constructor(client: ClientType, path: string) {
    super(client, path, qBook, BookService, [{ isLiteral: false, type: "string", name: "id", odataName: "id" }]);
  }
}
