// @ts-nocheck
import { ODataClient, ODataResponse, ODataModelResponse } from "@odata2ts/odata-client-api";
import { EntityTypeService, compileActionPath, EntitySetService, compileId } from "@odata2ts/odata-service";
import { Book } from "../TesterModel";
import { QBook, qBook } from "../QTester";

export class BookService extends EntityTypeService<Book, QBook> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public like(): ODataResponse<ODataModelResponse<void>> {
    const url = compileActionPath(this.getPath(), "Tester.like");
    return this.client.post(url, {});
  }

  public postReview(params: { rating: number; publicationDate?: string }): ODataResponse<ODataModelResponse<string>> {
    const url = compileActionPath(this.getPath(), "Tester.postReview");
    return this.client.post(url, params);
  }
}

export class BookCollectionService extends EntitySetService<Book, QBook, string | { id: string }> {
  private keySpec = [{ isLiteral: false, name: "id", odataName: "id" }];

  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public getKeySpec() {
    return this.keySpec;
  }

  public get(id: string | { id: string }): BookService {
    const url = compileId(this.path, this.keySpec, id);
    return new BookService(this.client, url);
  }
}
