import { ODataHttpClient, ODataHttpClientConfig } from "@odata2ts/http-client-api";
import { QEnumCollection } from "@odata2ts/odata-query-objects";
import {
  CollectionServiceV4,
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataServiceOptionsInternal,
  PrimitiveTypeServiceV4,
} from "../../../src";
import { EditablePersonModel, Feature, GetSomethingFunctionParams, PersonId, PersonModel } from "../PersonModel";
import { QPersonIdFunction } from "../QPerson";
import { QGetSomethingFunction, QPersonV4, qPersonV4 } from "./QPersonV4";

export class PersonModelService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV4
> {
  private _qGetSomething = new QGetSomethingFunction();

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, new QPersonV4(), options);
  }

  public userName() {
    const { client, path, qModel, options } = this.__base;
    return new PrimitiveTypeServiceV4<ClientType, "string">(
      client,
      path,
      "UserName",
      qModel.userName.converter,
      options,
    );
  }

  public age() {
    const { client, path, qModel, options } = this.__base;
    return new PrimitiveTypeServiceV4<ClientType, "string">(client, path, "Age", qModel.Age.converter, options);
  }

  public get features() {
    const { client, path, options } = this.__base;
    return new CollectionServiceV4(client, path, "Features", new QEnumCollection(Feature), options);
  }

  public get bestFriend() {
    const { client, path, options } = this.__base;
    return new PersonModelService(client, path, "BestFriend", options);
  }

  public get friends() {
    const { client, path, options } = this.__base;
    return new PersonModelCollectionService(client, path, "Friends", options);
  }

  public getSomething(params: GetSomethingFunctionParams, requestConfig?: ODataHttpClientConfig<ClientType>) {
    const { addFullPath, client, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qGetSomething.buildUrl(params, isUrlNotEncoded()));
    return client.get(url, requestConfig);
  }
}

export class PersonModelCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV4,
  PersonId
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, qPersonV4, new QPersonIdFunction(name), options);
  }
}
