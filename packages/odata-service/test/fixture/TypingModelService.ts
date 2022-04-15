import {
  GuidString,
  DateString,
  QGuidPath,
  QNumberPath,
  QDatePath,
  QCollectionPath,
  QEntityPath,
  QEntityCollectionPath,
  QueryObject,
  QGuidCollection,
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

export class QTest extends QueryObject {
  public readonly id = new QGuidPath(this.withPrefix("ID"));
  public readonly counter = new QNumberPath(this.withPrefix("counter"));
  public readonly date = new QDatePath(this.withPrefix("date"));
  public readonly tags = new QCollectionPath(this.withPrefix("tags"), () => QGuidCollection);
  public readonly other = new QEntityPath(this.withPrefix("other"), () => QTest);
  public readonly others = new QEntityCollectionPath(this.withPrefix("others"), () => QTest);

  constructor(path?: string) {
    super(path);
  }
}

export const qTest = new QTest();

export class TestService extends EntityTypeService<TestModel, QTest> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qTest);
  }
}

export class TestCollectionService extends EntitySetService<TestModel, QTest, GuidString | { ID: GuidString }> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qTest);
  }

  public get(id: GuidString | { ID: GuidString }): TestService {
    const url = "test";
    return new TestService(this.client, url);
  }
}
