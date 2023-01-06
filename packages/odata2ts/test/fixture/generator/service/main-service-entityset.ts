import { ODataClient } from "@odata2ts/odata-client-api";
import { ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { createTestEntityServiceResolver } from "./service/TestEntityService";

export class TesterService<ClientType extends ODataClient> extends ODataService<ClientType> {
  private _name: string = "Tester";
  public Ents = createTestEntityServiceResolver(this.client, this.getPath(), "Ents");
  public navToEnts = this.Ents.get.bind(this.Ents);
}
