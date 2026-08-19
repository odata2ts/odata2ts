import type { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataHttpMethods } from "@odata2ts/http-client-api";
import type { ODataModelResponseV4, ODataVersionV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
  UrlRequestCmd,
} from "@odata2ts/odata-service";
import type { QTestEntity } from "./QTester.js";
import { QPing, qTestEntity, QTestEntityId, QVote } from "./QTester.js";
import type { EditableTestEntity, TestEntity, TestEntityId, UpdatableTestEntity, VoteParams } from "./TesterModel.js";

export class TesterService extends ODataService {
  private _qPing?: QPing;
  private _qVote?: QVote;

  public tests(): TestEntityCollectionService;
  public tests(id: TestEntityId): TestEntityService;
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

    return new UrlRequestCmd<undefined>(client, ODataHttpMethods.Post, url, undefined, {
      headers: getDefaultHeaders(),
    });
  }

  public doLike(params: VoteParams) {
    if (!this._qVote) {
      this._qVote = new QVote();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qVote.buildUrl());

    return new UrlRequestCmd<ODataModelResponseV4<TestEntity>, VoteParams>(client, ODataHttpMethods.Post, url, params, {
      headers: getDefaultHeaders(),
      mainRequestConverter: this._qVote.getRequestConverter(),
      mainResponseConverter: this._qVote.getResponseConverter(),
    });
  }
}

export class TestEntityService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  TestEntity,
  UpdatableTestEntity,
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
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qTestEntity, new QTestEntityId(name), options);
  }
}
