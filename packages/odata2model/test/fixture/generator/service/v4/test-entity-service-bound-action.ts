import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import {
  EntityTypeServiceV4,
  ODataModelResponseV4,
  compileActionPath,
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

  public like(): ODataResponse<ODataModelResponseV4<void>> {
    const url = compileActionPath(this.getPath(), "Tester.like");
    return this.client.post(url, {});
  }

  public postReview(params: { rating: number; publicationDate?: string }): ODataResponse<ODataModelResponseV4<string>> {
    const url = compileActionPath(this.getPath(), "Tester.postReview");
    return this.client.post(url, params);
  }
}

export class BookCollectionService extends EntitySetServiceV4<Book, QBook, string | { id: string }, BookService> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qBook, BookService, [{ isLiteral: false, name: "id", odataName: "id" }]);
  }
}
