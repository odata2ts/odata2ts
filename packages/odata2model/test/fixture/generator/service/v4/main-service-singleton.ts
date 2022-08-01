import { ODataClient } from "@odata2ts/odata-client-api";
import { ODataService } from "@odata2ts/odata-service";
// @ts-ignore
import { TestEntityService } from "./service/TestEntityService";

export class TesterService extends ODataService {
  private _name: string = "Tester";
  private _currentUserSrv: TestEntityService;

  constructor(client: ODataClient<any>, basePath: string) {
    super(client, basePath);
  }

  public getCurrentUserSrv() {
    if (!this._currentUserSrv) {
      this._currentUserSrv = new TestEntityService(this.client, this.getPath() + "/current");
    }
    return this._currentUserSrv;
  }
}
