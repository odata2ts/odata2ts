import { ODataClient } from "@odata2ts/odata-client-api";
import { ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { TestEntityService } from "./service/TestEntityService";

export class TesterService<ClientType extends ODataClient> extends ODataService<ClientType> {
  private _currentUser?: TestEntityService<ClientType>;

  public currentUser() {
    if (!this._currentUser) {
      this._currentUser = new TestEntityService(this.client, this.getPath(), "CURRENT_USER");
    }

    return this._currentUser;
  }
}
