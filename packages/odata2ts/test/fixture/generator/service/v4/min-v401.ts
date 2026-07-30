import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataService, ODataServiceOptions } from "@odata2ts/odata-service";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType, "4.01"> {
  constructor(client: ClientType, basePath: string, options?: ODataServiceOptions) {
    super(client, basePath, { ...options, odataVersionV4: "4.01" });
  }
}
