import { ODataClient } from "@odata2ts/odata-client-api";
import { EntitySetServiceV4, EntityTypeServiceV4 } from "@odata2ts/odata-service";

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
  constructor(client: ClientType, path: string) {
    super(client, path, qTestEntity);
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
  constructor(client: ClientType, path: string) {
    super(client, path, qTestEntity, TestEntityService, new QTestEntityId(path));
  }
}
