import { ODataClient } from "@odata2ts/odata-client-api";
import { ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { TestEntityCollectionService } from "./service/TestEntityService";

export class TesterService<ClientType extends ODataClient> extends ODataService<ClientType> {
  private _name: string = "Tester";
  private _listSrv?: TestEntityCollectionService<ClientType>;

  constructor(client: ClientType, basePath: string) {
    super(client, basePath);
  }

  public getListSrv() {
    if (!this._listSrv) {
      this._listSrv = new TestEntityCollectionService(this.client, this.getPath(), "list");
    }

    return this._listSrv;
  }
}
