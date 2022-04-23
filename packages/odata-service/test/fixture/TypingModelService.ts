import {
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

import { EntityTypeServiceV4, EntitySetServiceV4 } from "../../src";

export interface TestModel {
  ID: string;
  counter: number;
  date?: string;
  tags: Array<string>;
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

export class TestService extends EntityTypeServiceV4<TestModel, QTest> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qTest);
  }
}

export class TestCollectionService extends EntitySetServiceV4<TestModel, QTest, string | { ID: string }> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qTest);
  }

  public get(id: string | { ID: string }): TestService {
    const url = "test";
    return new TestService(this.client, url);
  }
}
