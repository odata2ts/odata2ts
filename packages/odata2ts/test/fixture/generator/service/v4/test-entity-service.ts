import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityServiceResolver, EntitySetServiceV4, EntityTypeServiceV4 } from "@odata2ts/odata-service";

// @ts-ignore
import { QTestEntity, QTestEntityId, qTestEntity } from "../QTester";
// @ts-ignore
import { EditableTestEntity, TestEntity, TestEntityId } from "../TesterModel";

export class TestEntityService<ClientType extends ODataClient> extends EntityTypeServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qTestEntity);
  }
}

export class TestEntityCollectionService<ClientType extends ODataClient> extends EntitySetServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  TestEntityId,
  TestEntityService<ClientType>
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qTestEntity, TestEntityService, new QTestEntityId(name));
  }
}

export function createTestEntityServiceResolver(client: ODataClient, basePath: string, entityName: string) {
  return new EntityServiceResolver(
    client,
    basePath,
    entityName,
    QTestEntityId,
    TestEntityService,
    TestEntityCollectionService
  );
}
