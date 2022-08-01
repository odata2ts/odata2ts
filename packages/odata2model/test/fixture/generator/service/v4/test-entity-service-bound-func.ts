import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
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

export class BookService extends EntityTypeServiceV4<Book, EditableBook, QBook> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public bestReview(): ODataResponse<ODataModelResponseV4<string>> {
    const url = compileFunctionPathV4(this.getPath(), "Tester.BestReview");
    return this.client.get(url);
  }

  public filterReviews(params: {
    MIN_RATING: number;
    MinCreated?: string;
  }): ODataResponse<ODataCollectionResponseV4<Review>> {
    const url = compileFunctionPathV4(this.getPath(), "Tester.filterReviews", {
      MIN_RATING: { isLiteral: true, value: params.MIN_RATING },
      MinCreated: { isLiteral: true, value: params.MinCreated },
    });
    return this.client.get(url);
  }
}

export class BookCollectionService extends EntitySetServiceV4<
  Book,
  EditableBook,
  QBook,
  string | { id: string },
  BookService
> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qBook, BookService, [{ isLiteral: false, type: "string", name: "id", odataName: "id" }]);
  }
}
