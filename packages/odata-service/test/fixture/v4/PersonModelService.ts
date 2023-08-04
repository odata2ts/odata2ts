import { ODataHttpClient, ODataHttpClientConfig } from "@odata2ts/http-client-api";
import { QEnumCollection } from "@odata2ts/odata-query-objects";

import { CollectionServiceV4, EntitySetServiceV4, EntityTypeServiceV4, PrimitiveTypeServiceV4 } from "../../../src";
import { EditablePersonModel, GetSomethingFunctionParams, PersonId, PersonModel } from "../PersonModel";
import { QPersonIdFunction } from "../QPerson";
import { QGetSomethingFunction, QPersonV4, qPersonV4 } from "./QPersonV4";

export class PersonModelService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV4
> {
  private _qGetSomething = new QGetSomethingFunction();

  constructor(client: ODataHttpClient, basePath: string, name: string, bigNumbersAsString?: boolean) {
    super(client, basePath, name, new QPersonV4(), bigNumbersAsString);
  }

  public userName() {
    const { client, path, qModel } = this.__base;
    return new PrimitiveTypeServiceV4<ClientType, "string">(client, path, "UserName", qModel.userName.converter);
  }

  public age() {
    const { client, path, qModel } = this.__base;
    return new PrimitiveTypeServiceV4<ClientType, "string">(client, path, "Age", qModel.Age.converter);
  }

  public get features() {
    const { client, path } = this.__base;
    return new CollectionServiceV4(client, path, "Features", new QEnumCollection());
  }

  public get bestFriend() {
    const { client, path } = this.__base;
    return new PersonModelService(client, path, "BestFriend");
  }

  public get friends() {
    const { client, path } = this.__base;
    return new PersonModelCollectionService(client, path, "Friends");
  }

  public getSomething(params: GetSomethingFunctionParams, requestConfig?: ODataHttpClientConfig<ClientType>) {
    const url = this.__base.addFullPath(this._qGetSomething.buildUrl(params));
    return this.__base.client.get(url, requestConfig);
  }
}

export class PersonModelCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV4,
  PersonId
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, bigNumbersAsString?: boolean) {
    super(client, basePath, name, qPersonV4, new QPersonIdFunction(name), bigNumbersAsString);
  }
}
