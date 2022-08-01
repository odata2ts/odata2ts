import { ODataClient } from "@odata2ts/odata-client-api";
import { ODataService } from "@odata2ts/odata-service";
// @ts-ignore
import { TestEntityCollectionService } from "./service/TestEntityService";

export class TesterService extends ODataService {
  private _name: string = "Tester";
  private _listSrv?: TestEntityCollectionService;

  constructor(client: ODataClient<any>, basePath: string) {
    super(client, basePath);
  }

  public getListSrv() {
    if (!this._listSrv) {
      this._listSrv = new TestEntityCollectionService(this.client, this.getPath() + "/list");
    }

    return this._listSrv;
  }
}
