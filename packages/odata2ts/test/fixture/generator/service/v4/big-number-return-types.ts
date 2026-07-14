import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataHttpMethods } from "@odata2ts/http-client-api";
import type { ODataCollectionResponseV4, ODataValueResponseV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptions,
  ODataServiceOptionsInternal,
  UrlRequestCmd,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QTestEntity } from "./QTester";
// @ts-ignore
import { QPingBigNumber, QPingDecimal, QPingDecimalCollection, qTestEntity, QTestEntityId } from "./QTester";
// @ts-ignore
import type { EditableTestEntity, TestEntity, TestEntityId } from "./TesterModel";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qPingBigNumber?: QPingBigNumber;
  private _qPingDecimal?: QPingDecimal;
  private _qPingDecimalCollection?: QPingDecimalCollection;

  constructor(client: ClientType, basePath: string, options?: ODataServiceOptions) {
    super(client, basePath, options);
    this.__base.options.bigNumbersAsString = true;
  }

  public tests(): TestEntityCollectionService<ClientType>;
  public tests(id: TestEntityId): TestEntityService<ClientType>;
  public tests(id?: TestEntityId | undefined) {
    const fieldName = "tests";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new TestEntityCollectionService(client, path, fieldName, options)
      : new TestEntityService(client, path, new QTestEntityId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }

  public pingBigNumber() {
    if (!this._qPingBigNumber) {
      this._qPingBigNumber = new QPingBigNumber();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qPingBigNumber.buildUrl());

    return new UrlRequestCmd<ClientType, ODataValueResponseV4<string>>(client, ODataHttpMethods.Post, url, undefined, {
      headers: getDefaultHeaders(),
      mainResponseConverter: this._qPingBigNumber.getResponseConverter(),
    });
  }

  public pingDecimal() {
    if (!this._qPingDecimal) {
      this._qPingDecimal = new QPingDecimal();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qPingDecimal.buildUrl());

    return new UrlRequestCmd<ClientType, ODataValueResponseV4<string>>(client, ODataHttpMethods.Post, url, undefined, {
      headers: getDefaultHeaders(),
      mainResponseConverter: this._qPingDecimal.getResponseConverter(),
    });
  }

  public pingDecimalCollection() {
    if (!this._qPingDecimalCollection) {
      this._qPingDecimalCollection = new QPingDecimalCollection();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qPingDecimalCollection.buildUrl());

    return new UrlRequestCmd<ClientType, ODataCollectionResponseV4<string>>(
      client,
      ODataHttpMethods.Post,
      url,
      undefined,
      { headers: getDefaultHeaders(), mainResponseConverter: this._qPingDecimalCollection.getResponseConverter() },
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
