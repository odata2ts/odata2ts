import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataService } from "@odata2ts/odata-service";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {}
