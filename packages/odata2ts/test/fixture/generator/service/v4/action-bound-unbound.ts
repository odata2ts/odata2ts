import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataHttpMethods } from "@odata2ts/http-client-api";
import type { ODataModelResponseV4 } from "@odata2ts/odata-core";
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
import { QPing, qTestEntity, QTestEntityId, QVote } from "./QTester";
// @ts-ignore
import type { EditableTestEntity, TestEntity, TestEntityId, VoteParams } from "./TesterModel";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qPing?: QPing;
  private _qVote?: QVote;

  public tests(): TestEntityCollectionService<ClientType>;
  public tests(id: TestEntityId): TestEntityService<ClientType>;
  public tests(id?: TestEntityId | undefined) {
    const fieldName = "tests";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new TestEntityCollectionService(client, path, fieldName, options)
      : new TestEntityService(client, path, new QTestEntityId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }

  public keepAlive() {
    if (!this._qPing) {
      this._qPing = new QPing();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qPing.buildUrl());

    return new UrlRequestCmd<ClientType, undefined>(client, ODataHttpMethods.Post, url, undefined, {
      headers: getDefaultHeaders(),
    });
  }

  public doLike(params: VoteParams) {
    if (!this._qVote) {
      this._qVote = new QVote();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qVote.buildUrl());

    return new UrlRequestCmd<ClientType, ODataModelResponseV4<TestEntity>, VoteParams>(
      client,
      ODataHttpMethods.Post,
      url,
      params,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: this._qVote.getRequestConverter(),
        mainResponseConverter: this._qVote.getResponseConverter(),
      },
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
