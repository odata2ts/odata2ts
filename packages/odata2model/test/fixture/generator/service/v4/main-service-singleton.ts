import { ODataClient } from "@odata2ts/odata-client-api";
import { ODataService } from "@odata2ts/odata-service";
// @ts-ignore
import { TestEntityService } from "./service/TestEntityService";

export class TesterService extends ODataService {
  private name: string = "Tester";
  public current: TestEntityService;

  constructor(client: ODataClient<any>, basePath: string) {
    super(client, basePath);
    this.current = new TestEntityService(this.client, this.getPath() + "/current");
  }
}
