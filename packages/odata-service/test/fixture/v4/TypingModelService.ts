import { ODataClient } from "@odata2ts/odata-client-api";
import {
  QCollectionPath,
  QDatePath,
  QEntityCollectionPath,
  QEntityPath,
  QGuidCollection,
  QGuidPath,
  QNumberPath,
  QueryObject,
} from "@odata2ts/odata-query-objects";

import { EntitySetServiceV4, EntityTypeServiceV4 } from "../../../src";
import { QTypingIdFunction } from "../QTyping";
import { TypingId } from "../TypingModel";

export interface TestModel {
  ID: string;
  counter: number;
  date?: string;
  tags: Array<string>;
  other?: TestModel;
  others?: Array<TestModel>;
}

export type EditableTestModel = Pick<TestModel, "ID" | "counter"> & Partial<Omit<TestModel, "ID" | "counter">>;

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

export class TestService<ClientType extends ODataClient> extends EntityTypeServiceV4<
  ClientType,
  TestModel,
  EditableTestModel,
  QTest
> {
  constructor(client: ODataClient, basePath: string, name: string) {
    super(client, basePath, name, qTest);
  }
}

export class TestCollectionService<ClientType extends ODataClient> extends EntitySetServiceV4<
  ClientType,
  TestModel,
  EditableTestModel,
  QTest,
  TypingId,
  TestService<ClientType>
> {
  constructor(client: ODataClient, basePath: string, name: string) {
    super(client, basePath, name, qTest, TestService, new QTypingIdFunction(name));
  }
}
