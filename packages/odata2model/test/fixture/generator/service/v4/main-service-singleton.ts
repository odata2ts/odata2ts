import { ODataClient } from "@odata2ts/odata-client-api";
import { ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { TestEntityService } from "./service/TestEntityService";

export class TesterService<ClientType extends ODataClient> extends ODataService<ClientType> {
  private _name: string = "Tester";
  private _currentUserSrv?: TestEntityService<ClientType>;

  public getCurrentUserSrv() {
    if (!this._currentUserSrv) {
      this._currentUserSrv = new TestEntityService(this.client, this.getPath(), "CURRENT_USER");
    }

    return this._currentUserSrv;
  }
}
