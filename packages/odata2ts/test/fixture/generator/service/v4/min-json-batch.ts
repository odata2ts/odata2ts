import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { JsonBatchBuilder, ODataService, ODataServiceOptions } from "@odata2ts/odata-service";

export class TesterService extends ODataService<"4.0", JsonBatchBuilder<[]>> {
  constructor(client: ODataHttpClient, basePath: string, options?: ODataServiceOptions) {
    super(client, basePath, { ...options, batch: { format: "json" } });
  }
}
