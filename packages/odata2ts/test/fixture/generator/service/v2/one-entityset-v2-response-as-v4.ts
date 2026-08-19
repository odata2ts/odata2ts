import type { ODataHttpClient } from "@odata2ts/http-client-api";
import {
  EntitySetServiceV2,
  EntityTypeServiceV2,
  ODataService,
  ODataServiceOptions,
  ODataServiceOptionsInternalV2,
  PrimitiveTypeServiceV2,
} from "@odata2ts/odata-service";
import type { QTestEntity } from "./QTester.js";
import { qTestEntity, QTestEntityId } from "./QTester.js";
import type { EditableTestEntity, TestEntity, TestEntityId, UpdatableTestEntity } from "./TesterModel.js";

export class TesterService extends ODataService {
  constructor(client: ODataHttpClient, basePath: string, options?: ODataServiceOptions) {
    super(client, basePath, { ...options, v2ResponseAsV4: true } as any);
  }

  public ents(): TestEntityCollectionService<true>;
  public ents(id: TestEntityId): TestEntityService<true>;
  public ents(id?: TestEntityId | undefined) {
    const fieldName = "Ents";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new TestEntityCollectionService<true>(client, path, fieldName, options)
      : new TestEntityService<true>(
          client,
          path,
          new QTestEntityId(fieldName).buildUrl(id, isUrlNotEncoded()),
          options,
        );
  }
}

export class TestEntityService<AsV4 extends boolean = false> extends EntityTypeServiceV2<
  TestEntity,
  UpdatableTestEntity,
  QTestEntity,
  AsV4
> {
  private _id?: PrimitiveTypeServiceV2<string, AsV4>;
  private _test?: PrimitiveTypeServiceV2<string, AsV4>;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternalV2<AsV4>) {
    super(client, basePath, name, qTestEntity, options);
  }

  public id() {
    if (!this._id) {
      const { client, path, qModel, options } = this.__base;
      this._id = new PrimitiveTypeServiceV2(client, path, "id", qModel.id.converter, undefined, options);
    }

    return this._id;
  }

  public test() {
    if (!this._test) {
      const { client, path, qModel, options } = this.__base;
      this._test = new PrimitiveTypeServiceV2(client, path, "test", qModel.test.converter, undefined, options);
    }

    return this._test;
  }
}

export class TestEntityCollectionService<AsV4 extends boolean = false> extends EntitySetServiceV2<
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  TestEntityId,
  AsV4
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternalV2<AsV4>) {
    super(client, basePath, name, qTestEntity, new QTestEntityId(name), options);
  }
}
