import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataService, ODataServiceOptions } from "@odata2ts/odata-service";

export class TesterService extends ODataService<"4.01"> {
  constructor(client: ODataHttpClient, basePath: string, options?: ODataServiceOptions) {
    super(client, basePath, { ...options, odataVersionV4: "4.01" });
  }
}
