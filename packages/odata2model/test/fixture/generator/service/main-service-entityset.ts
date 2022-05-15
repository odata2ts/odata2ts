import { ODataClient } from "@odata2ts/odata-client-api";
import { ODataService } from "@odata2ts/odata-service";
// @ts-ignore
import { TestEntityCollectionService } from "./service/TestEntityService";

export class TesterService extends ODataService {
  private name: string = "Tester";
  public list: TestEntityCollectionService;

  constructor(client: ODataClient<any>, basePath: string) {
    super(client, basePath);
    this.list = new TestEntityCollectionService(this.client, this.getPath() + "/list");
  }
}
