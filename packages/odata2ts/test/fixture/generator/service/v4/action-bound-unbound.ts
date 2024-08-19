import type { HttpResponseModel, ODataHttpClient, ODataHttpClientConfig } from "@odata2ts/http-client-api";
import type { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import type { QTestEntity } from "./QTester";
// @ts-ignore
import { QPing, QTestEntityId, QVote, qTestEntity } from "./QTester";
// @ts-ignore
import type { EditableTestEntity, TestEntity, TestEntityId, VoteParams } from "./TesterModel";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qPing?: QPing;
  private _qVote?: QVote;

  public tests(): TestEntityCollectionService<ClientType>;
  public tests(id: TestEntityId): TestEntityService<ClientType>;
  public tests(id?: TestEntityId | undefined) {
    const fieldName = "tests";
    const { client, path } = this.__base;
    return typeof id === "undefined" || id === null
      ? new TestEntityCollectionService(client, path, fieldName)
      : new TestEntityService(client, path, new QTestEntityId(fieldName).buildUrl(id));
  }

  public async keepAlive(
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): Promise<HttpResponseModel<ODataModelResponseV4<void>>> {
    if (!this._qPing) {
      this._qPing = new QPing();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qPing.buildUrl());
    return client.post(url, {}, requestConfig, getDefaultHeaders());
  }

  public async doLike(
    params: VoteParams,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): Promise<HttpResponseModel<ODataModelResponseV4<TestEntity>>> {
    if (!this._qVote) {
      this._qVote = new QVote();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qVote.buildUrl());
    const response = await client.post(url, this._qVote.convertUserParams(params), requestConfig, getDefaultHeaders());
    return this._qVote.convertResponse(response);
  }
}

export class TestEntityService<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qTestEntity);
  }
}

export class TestEntityCollectionService<in out ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity,
  TestEntityId
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qTestEntity, new QTestEntityId(name));
  }
}
