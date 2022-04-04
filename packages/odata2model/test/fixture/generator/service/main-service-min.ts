import { ODataClient } from "@odata2ts/odata-client-api";
import { ODataService } from "@odata2ts/odata-service";

export class TesterService extends ODataService {
  private name: string = "Tester";

  constructor(client: ODataClient<any>, basePath: string) {
    super(client, basePath);
  }
}
