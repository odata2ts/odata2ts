import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityServiceResolver, EntitySetServiceV4, EntityTypeServiceV4 } from "@odata2ts/odata-service";

// @ts-ignore
import { Q_TEST_ENTITY, Q_TEST_ENTITY_ID, q_TEST_ENTITY } from "../QTester";
// @ts-ignore
import { EDITABLE_TEST_ENTITY, TEST_ENTITY, TEST_ENTITY_ID } from "../TesterModel";

export class TEST_ENTITY_SRV<ClientType extends ODataClient> extends EntityTypeServiceV4<
  ClientType,
  TEST_ENTITY,
  EDITABLE_TEST_ENTITY,
  Q_TEST_ENTITY
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, q_TEST_ENTITY);
  }
}

export class TEST_ENTITY_COLLECTION_SRV<ClientType extends ODataClient> extends EntitySetServiceV4<
  ClientType,
  TEST_ENTITY,
  EDITABLE_TEST_ENTITY,
  Q_TEST_ENTITY,
  TEST_ENTITY_ID,
  TEST_ENTITY_SRV<ClientType>
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, q_TEST_ENTITY, TEST_ENTITY_SRV, new Q_TEST_ENTITY_ID(name));
  }
}

export function CREATE_TEST_ENTITY_RSLVR(client: ODataClient, basePath: string, entityName: string) {
  return new EntityServiceResolver(
    client,
    basePath,
    entityName,
    Q_TEST_ENTITY_ID,
    TEST_ENTITY_SRV,
    TEST_ENTITY_COLLECTION_SRV
  );
}
