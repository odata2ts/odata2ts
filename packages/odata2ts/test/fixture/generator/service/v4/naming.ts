import { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { Q_TEST_ENTITY, Q_TEST_ENTITY_ID, q_TEST_ENTITY } from "./QTester";
// @ts-ignore
import { EDITABLE_TEST_ENTITY, TEST_ENTITY, TEST_ENTITY_ID } from "./TesterModel";

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

export class TEST_ENTITY_SRV<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  TEST_ENTITY,
  EDITABLE_TEST_ENTITY,
  Q_TEST_ENTITY
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, q_TEST_ENTITY);
  }
}

export class TEST_ENTITY_COLLECTION_SRV<ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  TEST_ENTITY,
  EDITABLE_TEST_ENTITY,
  Q_TEST_ENTITY,
  TEST_ENTITY_ID
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, q_TEST_ENTITY, new Q_TEST_ENTITY_ID(name));
  }
}
