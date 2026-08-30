import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataHttpMethods } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV4, ODataValueResponseV4, ODataVersionV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
  UrlRequestCmd,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QTestEntity } from "./QTester.js";
// @ts-ignore
import { QPingCollection, QPingNumber, QPingString, qTestEntity, QTestEntityId } from "./QTester.js";
// @ts-ignore
import type { EditableTestEntity, TestEntity, TestEntityId } from "./TesterModel.js";

export class TesterService extends ODataService {
  private _qPingString?: QPingString;
  private _qPingNumber?: QPingNumber;
  private _qPingCollection?: QPingCollection;

  public tests(): TestEntityCollectionService;
  public tests(id: TestEntityId): TestEntityService;
  public tests(id?: TestEntityId | undefined) {
    const fieldName = "tests";
    const { client, path, options } = this.__base;
    const collection = new TestEntityCollectionService(client, path, fieldName, options);
    return typeof id === "undefined" || id === null ? collection : collection.byId(id);
  }

  public pingString() {
    if (!this._qPingString) {
      this._qPingString = new QPingString();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qPingString.buildUrl());

    return new UrlRequestCmd<ODataValueResponseV4<string>>(client, ODataHttpMethods.Post, url, undefined, {
      headers: getDefaultHeaders(),
      mainResponseConverter: this._qPingString.getResponseConverter(),
    });
  }

  public pingNumber() {
    if (!this._qPingNumber) {
      this._qPingNumber = new QPingNumber();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qPingNumber.buildUrl());

    return new UrlRequestCmd<ODataValueResponseV4<number>>(client, ODataHttpMethods.Post, url, undefined, {
      headers: getDefaultHeaders(),
      mainResponseConverter: this._qPingNumber.getResponseConverter(),
    });
  }

  public pingCollection() {
    if (!this._qPingCollection) {
      this._qPingCollection = new QPingCollection();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qPingCollection.buildUrl());

    return new UrlRequestCmd<ODataCollectionResponseV4<string>>(client, ODataHttpMethods.Post, url, undefined, {
      headers: getDefaultHeaders(),
      mainResponseConverter: this._qPingCollection.getResponseConverter(),
    });
  }
}

export class TestEntityService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTestEntity, options);
  }
}

export class TestEntityCollectionService<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  TestEntityId,
  TestEntityService<V>,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTestEntity, new QTestEntityId(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternal<V> | undefined,
  ) {
    return new TestEntityService<V>(client, path, name, options);
  }
}
