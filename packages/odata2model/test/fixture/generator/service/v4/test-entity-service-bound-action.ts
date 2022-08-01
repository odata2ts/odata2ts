import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
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

export class BookService extends EntityTypeServiceV4<Book, EditableBook, QBook> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public like(): ODataResponse<ODataModelResponseV4<void>> {
    const url = compileActionPath(this.getPath(), "Tester.like");
    return this.client.post(url, {});
  }

  public postReview(params: {
    Rating: number;
    PUBLICATION_DATE?: string;
  }): ODataResponse<ODataModelResponseV4<Review>> {
    const url = compileActionPath(this.getPath(), "Tester.postReview");
    return this.client.post(url, params);
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
