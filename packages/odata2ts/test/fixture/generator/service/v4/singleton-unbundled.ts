import { ODataService } from "@odata2ts/odata-service";
// @ts-ignore
import { TestEntityService } from "./tester/test-entity/TestEntityService.js";

export class TesterService extends ODataService {
  private _currentUser?: TestEntityService;

  public currentUser() {
    if (!this._currentUser) {
      const { client, path, options } = this.__base;
      this._currentUser = new TestEntityService(client, path, "CURRENT_USER", options);
    }

    return this._currentUser;
  }
}
