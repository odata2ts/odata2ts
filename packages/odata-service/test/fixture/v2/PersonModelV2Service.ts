import { ODataHttpClient, ODataHttpClientConfig } from "@odata2ts/http-client-api";
import { QEnumCollection } from "@odata2ts/odata-query-objects";

import { CollectionServiceV2, EntitySetServiceV2, EntityTypeServiceV2, PrimitiveTypeServiceV2 } from "../../../src";
import { EditablePersonModel, GetSomethingFunctionParams, PersonId, PersonModel } from "../PersonModel";
import { QPersonIdFunction } from "../QPerson";
import { QGetSomethingFunction, QPersonV2, qPersonV2 } from "./QPersonV2";

export class PersonModelV2Service<ClientType extends ODataHttpClient> extends EntityTypeServiceV2<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV2
> {
  private _qGetSomething = new QGetSomethingFunction();

  public get features() {
    const { client, path } = this.__base;
    return new CollectionServiceV2(client, path, "Features", new QEnumCollection());
  }

  public userName() {
    const { client, path, qModel } = this.__base;

    return new PrimitiveTypeServiceV2<ClientType, "string">(
      client,
      path,
      "UserName",
      qModel.userName.converter,
      "userName"
    );
  }

  public get bestFriend() {
    return new PersonModelV2Service(this.__base.client, this.__base.path, "BestFriend");
  }

  public get friends() {
    return new PersonModelV2CollectionService(this.__base.client, this.__base.path, "Friends");
  }

  constructor(client: ODataHttpClient, basePath: string, name: string) {
    super(client, basePath, name, new QPersonV2());
  }

  public getSomething(params: GetSomethingFunctionParams, requestConfig?: ODataHttpClientConfig<ClientType>) {
    const url = this.__base.addFullPath(this._qGetSomething.buildUrl(params));
    return this.__base.client.get(url, requestConfig);
  }
}

export class PersonModelV2CollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV2<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV2,
  PersonId
> {
  constructor(client: ODataHttpClient, basePath: string, name: string) {
    super(client, basePath, name, qPersonV2, new QPersonIdFunction(name));
  }
}
