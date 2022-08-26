import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV4, EntitySetServiceV4 } from "@odata2ts/odata-service";
// @ts-ignore
import { TestEntity, EditableTestEntity } from "../TesterModel";
// @ts-ignore
import { QTestEntity, qTestEntity } from "../QTester";

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
  { id: string; age: number; deceased: boolean; desc: string },
  TestEntityService<ClientType>
> {
  constructor(client: ClientType, path: string) {
    super(client, path, qTestEntity, TestEntityService, [
      { isLiteral: true, type: "string", name: "id", odataName: "id" },
      { isLiteral: true, type: "number", name: "age", odataName: "age" },
      { isLiteral: true, type: "boolean", name: "deceased", odataName: "deceased" },
      { isLiteral: false, type: "string", name: "desc", odataName: "desc" },
    ]);
  }
}
