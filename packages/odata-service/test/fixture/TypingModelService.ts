import {
  GuidString,
  DateString,
  QEntityModel,
  QGuidPath,
  QNumberPath,
  QDatePath,
  qGuidCollection,
  QCollectionPath,
  QEntityPath,
  QEntityCollectionPath,
} from "@odata2ts/odata-query-objects";
import { ODataClient } from "@odata2ts/odata-client-api";

import { EntityTypeService, EntitySetService } from "../../src";

export interface TestModel {
  ID: GuidString;
  counter: number;
  date?: DateString;
  tags: Array<GuidString>;
  other?: TestModel;
  others?: Array<TestModel>;
}

export const qTest: QEntityModel<TestModel> = {
  id: new QGuidPath("ID"),
  counter: new QNumberPath("counter"),
  date: new QDatePath("date"),
  tags: new QCollectionPath("tags", () => qGuidCollection),
  other: new QEntityPath("other", () => qTest),
  others: new QEntityCollectionPath("others", () => qTest),
};

export class TestService extends EntityTypeService<TestModel> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qTest);
  }
}

export class TestCollectionService extends EntitySetService<TestModel, GuidString | { ID: GuidString }> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qTest);
  }

  public get(id: GuidString | { ID: GuidString }): TestService {
    const url = "test";
    return new TestService(this.client, url);
  }
}
