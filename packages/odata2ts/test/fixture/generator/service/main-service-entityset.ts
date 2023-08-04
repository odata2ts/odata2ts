import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QTestEntityId } from "./QTester";
// @ts-ignore
import { TestEntityCollectionService, TestEntityService } from "./service/TestEntityService";
// @ts-ignore
import { TestEntityId } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  public ents(): TestEntityCollectionService<ClientType>;
  public ents(id: TestEntityId): TestEntityService<ClientType>;
  public ents(id?: TestEntityId | undefined) {
    const fieldName = "Ents";
    return typeof id === "undefined" || id === null
      ? new TestEntityCollectionService(this.__base.client, this.__base.path, fieldName)
      : new TestEntityService(this.__base.client, this.__base.path, new QTestEntityId(fieldName).buildUrl(id));
  }
}
