// @ts-nocheck
import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeService, EntitySetService, compileId } from "@odata2ts/odata-service";
import { TestEntity } from "../TesterModel";
import { QTestEntity, qTestEntity } from "../QTester";

export class TestEntityService extends EntityTypeService<TestEntity, QTestEntity> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qTestEntity);
  }
}

export class TestEntityCollectionService extends EntitySetService<TestEntity, QTestEntity, string | { id: string }> {
  private keySpec = [{ isLiteral: false, name: "id", odataName: "id" }];

  constructor(client: ODataClient, path: string) {
    super(client, path, qTestEntity);
  }

  public getKeySpec() {
    return this.keySpec;
  }

  public get(id: string | { id: string }): TestEntityService {
    const url = compileId(this.path, this.keySpec, id);
    return new TestEntityService(this.client, url);
  }
}
