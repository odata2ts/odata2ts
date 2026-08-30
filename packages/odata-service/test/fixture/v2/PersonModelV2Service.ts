import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataEntityModelResponseV2 } from "@odata2ts/odata-core";
import { EntityResponseConverterV2, QEnumCollection } from "@odata2ts/odata-query-objects";
import {
  CollectionServiceV2,
  EntitySetServiceV2,
  EntityTypeServiceV2,
  MediaEntityServiceV2,
  ODataServiceOptions,
  ODataServiceOptionsInternalV2,
  PrimitiveTypeServiceV2,
  UrlRequestCmd,
} from "../../../src";
import { EditablePersonModel, Feature, GetSomethingFunctionParams, PersonId, PersonModel } from "../PersonModel";
import { QPersonIdFunction } from "../QPerson";
import { QGetSomethingFunction, QPersonV2, qPersonV2 } from "./QPersonV2";

export class PersonModelV2Service extends EntityTypeServiceV2<PersonModel, EditablePersonModel, QPersonV2> {
  private _qGetSomething = new QGetSomethingFunction();

  public get features() {
    const { client, path, options } = this.__base;
    return new CollectionServiceV2(client, path, "Features", new QEnumCollection(Feature), options);
  }

  public userName() {
    const { client, path, qModel, options } = this.__base;

    return new PrimitiveTypeServiceV2<string>(client, path, "UserName", qModel.userName.converter, "userName", options);
  }

  public get bestFriend() {
    const { client, path, options } = this.__base;
    return new PersonModelV2Service(client, path, "BestFriend", options);
  }

  public get friends() {
    const { client, path, options } = this.__base;
    return new PersonModelV2CollectionService(client, path, "Friends", options);
  }

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternalV2) {
    super(client, basePath, name, new QPersonV2(), options);
  }

  public getSomething(params: GetSomethingFunctionParams) {
    const { client, addFullPath, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qGetSomething.buildUrl(params, isUrlNotEncoded()));
    return new UrlRequestCmd<ODataEntityModelResponseV2<PersonModel>>(client, ODataHttpMethods.Get, url, undefined, {
      mainResponseConverter: new EntityResponseConverterV2(qPersonV2),
    });
  }
}

/** Same entity, only declared `m:HasStream="true"` - which is all the generator does differently. */
export class PersonModelV2MediaService extends MediaEntityServiceV2<PersonModel, EditablePersonModel, QPersonV2> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternalV2) {
    super(client, basePath, name, new QPersonV2(), options);
  }
}

export class PersonModelV2CollectionService extends EntitySetServiceV2<
  PersonModel,
  EditablePersonModel,
  QPersonV2,
  PersonId,
  PersonModelV2Service
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternalV2) {
    super(client, basePath, name, qPersonV2, new QPersonIdFunction(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternalV2 | undefined,
  ) {
    return new PersonModelV2Service(client, path, name, options);
  }
}
