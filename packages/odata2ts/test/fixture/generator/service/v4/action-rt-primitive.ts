import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataHttpMethods } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV4, ODataValueResponseV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
  UrlRequestCmd,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QTestEntity } from "./QTester";
// @ts-ignore
import { QPingCollection, QPingNumber, QPingString, qTestEntity, QTestEntityId } from "./QTester";
// @ts-ignore
import type { EditableTestEntity, TestEntity, TestEntityId } from "./TesterModel";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qPingString?: QPingString;
  private _qPingNumber?: QPingNumber;
  private _qPingCollection?: QPingCollection;

  public tests(): TestEntityCollectionService<ClientType>;
  public tests(id: TestEntityId): TestEntityService<ClientType>;
  public tests(id?: TestEntityId | undefined) {
    const fieldName = "tests";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new TestEntityCollectionService(client, path, fieldName, options)
      : new TestEntityService(client, path, new QTestEntityId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }

  public pingString() {
    if (!this._qPingString) {
      this._qPingString = new QPingString();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qPingString.buildUrl());

    return new UrlRequestCmd<ClientType, ODataValueResponseV4<string>>(client, ODataHttpMethods.Post, url, undefined, {
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

    return new UrlRequestCmd<ClientType, ODataValueResponseV4<number>>(client, ODataHttpMethods.Post, url, undefined, {
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

    return new UrlRequestCmd<ClientType, ODataCollectionResponseV4<string>>(
      client,
      ODataHttpMethods.Post,
      url,
      undefined,
      { headers: getDefaultHeaders(), mainResponseConverter: this._qPingCollection.getResponseConverter() },
    );
  }
}

export class TestEntityService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qTestEntity, options);
  }
}

export class TestEntityCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  TestEntityId
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qTestEntity, new QTestEntityId(name), options);
  }
}
