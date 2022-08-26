import { ODataClient } from "@odata2ts/odata-client-api";
import { ODataService } from "@odata2ts/odata-service";

export class TesterService<ClientType extends ODataClient> extends ODataService<ClientType> {
  private _name: string = "Tester";

  constructor(client: ClientType, basePath: string) {
    super(client, basePath);
  }
}
