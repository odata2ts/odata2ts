import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataVersionV4 } from "@odata2ts/odata-core";
import {
  QCollectionPath,
  QDatePath,
  QEntityCollectionPath,
  QEntityPath,
  QGuidCollection,
  QId,
  QNumberParam,
  QNumberPath,
  QStringParam,
  QStringPath,
  QueryObject,
} from "@odata2ts/odata-query-objects";
import { numberToStringConverter } from "@odata2ts/test-converters";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataServiceOptionsInternal } from "../../../src";

export interface TestModel {
  id: string;
  counter: number;
  date?: string;
  tags: Array<string>;
  other?: TestModel;
  others?: Array<TestModel>;
  name?: string;
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
  public readonly name = new QStringPath(this.withPrefix("NAME"));

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

export class TestService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  TestModel,
  EditableTestModel,
  QTest,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTest, options);
  }
}

export class TestCollectionService<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  TestModel,
  EditableTestModel,
  QTest,
  TestModelId,
  TestService<V>,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTest, new QTestIdFunction(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternal<V> | undefined,
  ) {
    return new TestService<V>(client, path, name, options!);
  }
}

/**
 * An id with `name` as an alternate key alongside the primary `id` - the shape `Core.AlternateKeys`
 * codegen produces: the primary key's param set always first.
 */
export type TestModelIdWithAlternateKey = string | { id: string } | { name: string };

export class QTestIdWithAlternateKeyFunction extends QId<TestModelIdWithAlternateKey> {
  getParams() {
    return [[new QNumberParam("ID", "id", numberToStringConverter)], [new QStringParam("NAME", "name")]];
  }
}

export class TestCollectionServiceWithAlternateKey<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  TestModel,
  EditableTestModel,
  QTest,
  TestModelIdWithAlternateKey,
  TestService<V>,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTest, new QTestIdWithAlternateKeyFunction(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternal<V> | undefined,
  ) {
    return new TestService<V>(client, path, name, options!);
  }
}
