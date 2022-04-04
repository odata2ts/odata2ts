// @ts-nocheck
import { ODataClient, ODataResponse, ODataModelResponse, ODataCollectionResponse } from "@odata2ts/odata-client-api";
import { EntityTypeService, compileFunctionPath, EntitySetService, compileId } from "@odata2ts/odata-service";
import { Book } from "../TesterModel";
import { qBook } from "../QTester";

export class BookService extends EntityTypeService<Book> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public bestReview(): ODataResponse<ODataModelResponse<string>> {
    const url = compileFunctionPath(this.getPath(), "Tester.bestReview");
    return this.client.get(url);
  }

  public filterReviews(params: {
    minRating: number;
    minCreated?: string;
  }): ODataResponse<ODataCollectionResponse<string>> {
    const url = compileFunctionPath(this.getPath(), "Tester.filterReviews", {
      minRating: { isLiteral: true, value: params.minRating },
      minCreated: { isLiteral: true, value: params.minCreated },
    });
    return this.client.get(url);
  }
}

export class BookCollectionService extends EntitySetService<Book, string | { id: string }> {
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
