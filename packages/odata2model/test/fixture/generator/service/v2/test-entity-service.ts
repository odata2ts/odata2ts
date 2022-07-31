import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV2, EntitySetServiceV2 } from "@odata2ts/odata-service";
// @ts-ignore
import { TestEntity, EditableTestEntity } from "../TesterModel";
// @ts-ignore
import { QTestEntity, qTestEntity } from "../QTester";

export class TestEntityService extends EntityTypeServiceV2<TestEntity, EditableTestEntity, QTestEntity> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qTestEntity);
  }
}

export class TestEntityCollectionService extends EntitySetServiceV2<
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  {
    id: string;
    age: number;
    deceased: boolean;
    desc: string;
    dateAndTime: string;
    dateAndTimeAndOffset: string;
    time: string;
  },
  TestEntityService
> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qTestEntity, TestEntityService, [
      { isLiteral: false, type: "string", typePrefix: "guid", name: "id", odataName: "id" },
      { isLiteral: true, type: "number", name: "age", odataName: "age" },
      { isLiteral: true, type: "boolean", name: "deceased", odataName: "deceased" },
      { isLiteral: false, type: "string", name: "desc", odataName: "desc" },
      { isLiteral: false, type: "string", typePrefix: "datetime", name: "dateAndTime", odataName: "dateAndTime" },
      {
        isLiteral: false,
        type: "string",
        typePrefix: "datetimeoffset",
        name: "dateAndTimeAndOffset",
        odataName: "dateAndTimeAndOffset",
      },
      { isLiteral: false, type: "string", typePrefix: "time", name: "time", odataName: "time" },
    ]);
  }
}
