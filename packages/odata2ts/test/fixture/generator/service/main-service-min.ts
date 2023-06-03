import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataService } from "@odata2ts/odata-service";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {}
