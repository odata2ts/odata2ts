import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { Q_TEST_ENTITY_ID } from "./QTester";
// @ts-ignore
import { TEST_ENTITY_COLLECTION_SRV, TEST_ENTITY_SRV } from "./service/TEST_ENTITY_SRV";
// @ts-ignore
import { TEST_ENTITY_ID } from "./TesterModel";

export class tester<ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  public NAVIGATE_TO_LIST(): TEST_ENTITY_COLLECTION_SRV<ClientType>;
  public NAVIGATE_TO_LIST(id: TEST_ENTITY_ID): TEST_ENTITY_SRV<ClientType>;
  public NAVIGATE_TO_LIST(id?: TEST_ENTITY_ID | undefined) {
    const fieldName = "list";
    const { client, path } = this.__base;
    return typeof id === "undefined" || id === null
      ? new TEST_ENTITY_COLLECTION_SRV(client, path, fieldName)
      : new TEST_ENTITY_SRV(client, path, new Q_TEST_ENTITY_ID(fieldName).buildUrl(id));
  }
}
