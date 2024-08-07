import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataService } from "@odata2ts/odata-service";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  constructor(client: ClientType, basePath: string) {
    super(client, basePath, true);
  }
}
