import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV4, EntitySetServiceV4 } from "@odata2ts/odata-service";
// @ts-ignore
import { TestEntity, EditableTestEntity } from "../TesterModel";
// @ts-ignore
import { QTestEntity, qTestEntity } from "../QTester";

export class TestEntityService extends EntityTypeServiceV4<TestEntity, EditableTestEntity, QTestEntity> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qTestEntity);
  }
}

export class TestEntityCollectionService extends EntitySetServiceV4<
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  string | { id: string },
  TestEntityService
> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qTestEntity, TestEntityService, [{ isLiteral: false, name: "id", odataName: "id" }]);
  }
}
