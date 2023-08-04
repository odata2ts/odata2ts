import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { TestEntityService } from "./service/TestEntityService";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _currentUser?: TestEntityService<ClientType>;

  public currentUser() {
    if (!this._currentUser) {
      this._currentUser = new TestEntityService(this.__base.client, this.__base.path, "CURRENT_USER");
    }

    return this._currentUser;
  }
}
