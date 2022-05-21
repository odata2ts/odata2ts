import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import {
  EntityTypeServiceV4,
  ODataModelResponseV4,
  compileFunctionPathV4,
  ODataCollectionResponseV4,
  EntitySetServiceV4,
} from "@odata2ts/odata-service";
// @ts-ignore
import { Book } from "../TesterModel";
// @ts-ignore
import { QBook, qBook } from "../QTester";

export class BookService extends EntityTypeServiceV4<Book, QBook> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public bestReview(): ODataResponse<ODataModelResponseV4<string>> {
    const url = compileFunctionPathV4(this.getPath(), "Tester.bestReview");
    return this.client.get(url);
  }

  public filterReviews(params: {
    minRating: number;
    minCreated?: string;
  }): ODataResponse<ODataCollectionResponseV4<string>> {
    const url = compileFunctionPathV4(this.getPath(), "Tester.filterReviews", {
      minRating: { isLiteral: true, value: params.minRating },
      minCreated: { isLiteral: true, value: params.minCreated },
    });
    return this.client.get(url);
  }
}

export class BookCollectionService extends EntitySetServiceV4<Book, QBook, string | { id: string }, BookService> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qBook, BookService, [{ isLiteral: false, name: "id", odataName: "id" }]);
  }
}
