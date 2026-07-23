import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataEntityModelResponseV2 } from "@odata2ts/odata-core";
import { EntityResponseConverterV2, QEnumCollection } from "@odata2ts/odata-query-objects";
import {
  CollectionServiceV2,
  EntitySetServiceV2,
  EntityTypeServiceV2,
  ODataServiceOptions,
  PrimitiveTypeServiceV2,
  UrlRequestCmd,
} from "../../../src";
import { EditablePersonModel, Feature, GetSomethingFunctionParams, PersonId, PersonModel } from "../PersonModel";
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
    const { client, path, options } = this.__base;
    return new CollectionServiceV2(client, path, "Features", new QEnumCollection(Feature), options);
  }

  public userName() {
    const { client, path, qModel, options } = this.__base;

    return new PrimitiveTypeServiceV2<ClientType, string>(
      client,
      path,
      "UserName",
      qModel.userName.converter,
      "userName",
      options,
    );
  }

  public get bestFriend() {
    const { client, path, options } = this.__base;
    return new PersonModelV2Service(client, path, "BestFriend", options);
  }

  public get friends() {
    const { client, path, options } = this.__base;
    return new PersonModelV2CollectionService(client, path, "Friends", options);
  }

  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, new QPersonV2(), options);
  }

  public getSomething(params: GetSomethingFunctionParams) {
    const { client, addFullPath, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qGetSomething.buildUrl(params, isUrlNotEncoded()));
    return new UrlRequestCmd<ClientType, ODataEntityModelResponseV2<PersonModel>>(
      client,
      ODataHttpMethods.Get,
      url,
      undefined,
      {
        mainResponseConverter: new EntityResponseConverterV2(qPersonV2),
      },
    );
  }
}

export class PersonModelV2CollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV2<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV2,
  PersonId
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qPersonV2, new QPersonIdFunction(name), options);
  }
}
