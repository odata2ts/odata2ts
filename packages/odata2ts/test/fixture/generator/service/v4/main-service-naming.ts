import { ODataClient } from "@odata2ts/odata-client-api";
import { ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { TEST_ENTITY_COLLECTION_SRV } from "./service/TEST_ENTITY_SRV";

export class TesterService<ClientType extends ODataClient> extends ODataService<ClientType> {
  private NAME_: string = "Tester";
  private LIST_?: TEST_ENTITY_COLLECTION_SRV<ClientType>;

  public NAVIGATE_TO_LIST() {
    if (!this.LIST_) {
      this.LIST_ = new TEST_ENTITY_COLLECTION_SRV(this.client, this.getPath(), "list");
    }

    return this.LIST_;
  }
}
