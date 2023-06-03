import { ODataHttpClient } from "@odata2ts/http-client-api";
import {
  QCollectionPath,
  QDatePath,
  QEntityCollectionPath,
  QEntityPath,
  QGuidCollection,
  QId,
  QNumberParam,
  QNumberPath,
  QueryObject,
} from "@odata2ts/odata-query-objects";
import { numberToStringConverter } from "@odata2ts/test-converters";

import { EntitySetServiceV4, EntityTypeServiceV4 } from "../../../src";

export interface TestModel {
  id: string;
  counter: number;
  date?: string;
  tags: Array<string>;
  other?: TestModel;
  others?: Array<TestModel>;
}

export type TestModelId = string | { id: string };

export type EditableTestModel = Pick<TestModel, "id" | "counter"> & Partial<Omit<TestModel, "id" | "counter">>;

export class QTest extends QueryObject {
  public readonly id = new QNumberPath(this.withPrefix("ID"), numberToStringConverter);
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

export class QTestIdFunction extends QId<TestModelId> {
  getParams() {
    return [new QNumberParam("ID", "id", numberToStringConverter)];
  }
}

export class TestService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  TestModel,
  EditableTestModel,
  QTest
> {
  constructor(client: ODataHttpClient, basePath: string, name: string) {
    super(client, basePath, name, qTest);
  }
}

export class TestCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  TestModel,
  EditableTestModel,
  QTest,
  TestModelId
> {
  constructor(client: ODataHttpClient, basePath: string, name: string) {
    super(client, basePath, name, qTest, new QTestIdFunction(name));
  }
}
