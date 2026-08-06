import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataService, ODataServiceOptions } from "@odata2ts/odata-service";

export class TesterService extends ODataService {
  constructor(client: ODataHttpClient, basePath: string, options?: ODataServiceOptions) {
    super(client, basePath, { ...options, bigNumbersAsString: true });
  }
}
