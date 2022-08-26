import { ODataClient, ODataClientConfig, ODataResponse } from "@odata2ts/odata-client-api";
import {
  EntityTypeServiceV4,
  ODataModelResponseV4,
  compileFunctionPathV4,
  ODataCollectionResponseV4,
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

  public bestReview(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<ODataModelResponseV4<string>> {
    const url = compileFunctionPathV4(this.getPath(), "Tester.BestReview");
    return this.client.get(url, requestConfig);
  }

  public filterReviews(
    params: { MIN_RATING: number; MinCreated?: string },
    requestConfig?: ODataClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV4<Review>> {
    const url = compileFunctionPathV4(this.getPath(), "Tester.filterReviews", {
      MIN_RATING: { isLiteral: true, value: params.MIN_RATING },
      MinCreated: { isLiteral: true, value: params.MinCreated },
    });
    return this.client.get(url, requestConfig);
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
