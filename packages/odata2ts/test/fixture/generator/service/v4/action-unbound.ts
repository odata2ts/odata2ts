import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QPing, QTestEntity, QTestEntityId, QVote, qTestEntity } from "./QTester";
// @ts-ignore
import { EditableTestEntity, TestEntity, TestEntityId, VoteParams } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qPing?: QPing;
  private _qVote?: QVote;

  public async keepAlive(requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<ODataModelResponseV4<void>> {
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
  ): ODataResponse<ODataModelResponseV4<TestEntity>> {
    if (!this._qVote) {
      this._qVote = new QVote();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qVote.buildUrl());
    const response = await client.post(url, this._qVote.convertUserParams(params), requestConfig, getDefaultHeaders());
    return this._qVote.convertResponse(response);
  }
}

export class TestEntityService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qTestEntity);
  }
}

export class TestEntityCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV4<
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
