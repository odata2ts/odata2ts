import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataValueResponseV4 } from "@odata2ts/odata-core";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import {
  QPingBigNumber,
  QPingDecimal,
  QPingDecimalCollection,
  QTestEntity,
  QTestEntityId,
  qTestEntity,
} from "./QTester";
// @ts-ignore
import { EditableTestEntity, TestEntity, TestEntityId } from "./TesterModel";

export class TesterService<ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qPingBigNumber?: QPingBigNumber;
  private _qPingDecimal?: QPingDecimal;
  private _qPingDecimalCollection?: QPingDecimalCollection;

  constructor(client: ClientType, basePath: string) {
    super(client, basePath, true);
  }

  public async pingBigNumber(
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataValueResponseV4<string>> {
    if (!this._qPingBigNumber) {
      this._qPingBigNumber = new QPingBigNumber();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qPingBigNumber.buildUrl());
    const response = await client.post(url, {}, requestConfig, getDefaultHeaders());
    return this._qPingBigNumber.convertResponse(response);
  }

  public async pingDecimal(
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataValueResponseV4<string>> {
    if (!this._qPingDecimal) {
      this._qPingDecimal = new QPingDecimal();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qPingDecimal.buildUrl());
    const response = await client.post(url, {}, requestConfig, getDefaultHeaders());
    return this._qPingDecimal.convertResponse(response);
  }

  public async pingDecimalCollection(
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<ODataCollectionResponseV4<string>> {
    if (!this._qPingDecimalCollection) {
      this._qPingDecimalCollection = new QPingDecimalCollection();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qPingDecimalCollection.buildUrl());
    const response = await client.post(url, {}, requestConfig, getDefaultHeaders());
    return this._qPingDecimalCollection.convertResponse(response);
  }
}

export class TestEntityService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  TestEntity,
  EditableTestEntity,
  QTestEntity
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qTestEntity, true);
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
    super(client, basePath, name, qTestEntity, new QTestEntityId(name), true);
  }
}
