import { HttpResponseModel, ODataHttpClient, ODataHttpClientConfig } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataValueResponseV4 } from "@odata2ts/odata-core";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataService } from "@odata2ts/odata-service";

// @ts-ignore
import { QPingCollection, QPingNumber, QPingString, QTestEntity, QTestEntityId, qTestEntity } from "./QTester";
// @ts-ignore
import { EditableTestEntity, TestEntity, TestEntityId } from "./TesterModel";

export class TesterService<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  private _qPingString?: QPingString;
  private _qPingNumber?: QPingNumber;
  private _qPingCollection?: QPingCollection;

  public tests(): TestEntityCollectionService<ClientType>;
  public tests(id: TestEntityId): TestEntityService<ClientType>;
  public tests(id?: TestEntityId | undefined) {
    const fieldName = "tests";
    const { client, path } = this.__base;
    return typeof id === "undefined" || id === null
      ? new TestEntityCollectionService(client, path, fieldName)
      : new TestEntityService(client, path, new QTestEntityId(fieldName).buildUrl(id));
  }

  public async pingString(
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): Promise<HttpResponseModel<ODataValueResponseV4<string>>> {
    if (!this._qPingString) {
      this._qPingString = new QPingString();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qPingString.buildUrl());
    const response = await client.post(url, {}, requestConfig, getDefaultHeaders());
    return this._qPingString.convertResponse(response);
  }

  public async pingNumber(
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): Promise<HttpResponseModel<ODataValueResponseV4<number>>> {
    if (!this._qPingNumber) {
      this._qPingNumber = new QPingNumber();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qPingNumber.buildUrl());
    const response = await client.post(url, {}, requestConfig, getDefaultHeaders());
    return this._qPingNumber.convertResponse(response);
  }

  public async pingCollection(
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): Promise<HttpResponseModel<ODataCollectionResponseV4<string>>> {
    if (!this._qPingCollection) {
      this._qPingCollection = new QPingCollection();
    }

    const { addFullPath, client, getDefaultHeaders } = this.__base;
    const url = addFullPath(this._qPingCollection.buildUrl());
    const response = await client.post(url, {}, requestConfig, getDefaultHeaders());
    return this._qPingCollection.convertResponse(response);
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
