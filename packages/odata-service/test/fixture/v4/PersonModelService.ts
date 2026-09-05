import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataModelResponseV4, ODataValueResponseV4, ODataVersionV4 } from "@odata2ts/odata-core";
import { ModelResponseConverterV4, QEnumCollection } from "@odata2ts/odata-query-objects";
import {
  CacheKeyState,
  CollectionServiceV4,
  ComposableUrlRequestCmd,
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataServiceOptionsInternal,
  PrimitiveTypeServiceV4,
  UrlGetRequestCmd,
  UrlRequestCmd,
} from "../../../src";
import { EditablePersonModel, Feature, GetSomethingFunctionParams, PersonId, PersonModel } from "../PersonModel";
import { QPersonIdFunction } from "../QPerson";
import { QGetScoreFunction, QGetSomethingComposable, QGetSomethingFunction, QPersonV4, qPersonV4 } from "./QPersonV4";

export class PersonModelService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  PersonModel,
  EditablePersonModel,
  QPersonV4,
  V
> {
  private _qGetSomething = new QGetSomethingFunction();

  private _qGetComposable = new QGetSomethingComposable();

  private _qGetScore = new QGetScoreFunction();

  constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    options?: ODataServiceOptionsInternal<V>,
    cacheKeyState?: CacheKeyState,
  ) {
    super(client, basePath, name, new QPersonV4(), options, cacheKeyState);
  }

  public userName() {
    const { client, path, qModel, options } = this.__base;
    return new PrimitiveTypeServiceV4<string, V>(client, path, "UserName", qModel.userName.converter, options);
  }

  public age() {
    const { client, path, qModel, options } = this.__base;
    return new PrimitiveTypeServiceV4<string, V>(client, path, "Age", qModel.age.converter, options);
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

  public getSomething(params: GetSomethingFunctionParams) {
    const { addFullPath, client, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qGetSomething.buildUrl(params, isUrlNotEncoded()));

    return new UrlRequestCmd<ODataModelResponseV4<PersonModel>>(client, ODataHttpMethods.Get, url, undefined, {
      mainResponseConverter: new ModelResponseConverterV4(qPersonV4),
    });
  }

  public getSomething2() {
    const { addFullPath, client, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qGetSomething.buildUrl(undefined, isUrlNotEncoded()));

    return new UrlGetRequestCmd<ODataModelResponseV4<PersonModel>>(client, url, {
      mainResponseConverter: new ModelResponseConverterV4(qPersonV4),
    });
  }

  public getSomethingComposable(params: GetSomethingFunctionParams) {
    const { addFullPath, client, isUrlNotEncoded, options } = this.__base;
    const url = addFullPath(this._qGetComposable.buildUrl(params, isUrlNotEncoded()));

    return new ComposableUrlRequestCmd<PersonModelService<V>, ODataModelResponseV4<PersonModel>>(
      client,
      url,
      (finalUrl: string) => new PersonModelService<V>(client, finalUrl, "", options),
      {
        mainResponseConverter: new ModelResponseConverterV4(qPersonV4),
      },
    );
  }

  /**
   * Operation with a primitive (value) return type — used to verify that the value response is run
   * through the operation's response converter on {@link execute}.
   */
  public getScore() {
    const { addFullPath, client, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qGetScore.buildUrl(undefined, isUrlNotEncoded()));

    return new UrlGetRequestCmd<ODataValueResponseV4<string>>(client, url, {
      mainResponseConverter: this._qGetScore.getResponseConverter(),
    });
  }
}

export class PersonModelCollectionService<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  PersonModel,
  EditablePersonModel,
  QPersonV4,
  PersonId,
  PersonModelService<V>,
  V
> {
  private _qGetSomething = new QGetSomethingFunction();

  constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    options?: ODataServiceOptionsInternal<V>,
    cacheKeyState?: CacheKeyState,
  ) {
    super(client, basePath, name, qPersonV4, new QPersonIdFunction(name), options, cacheKeyState);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternal<V> | undefined,
    cacheKeyState?: CacheKeyState,
  ) {
    return new PersonModelService<V>(client, path, name, options, cacheKeyState);
  }

  /**
   * Operation bound to the entity collection (binding param is `Collection(Person)`).
   * Its URL segment is appended to the collection path itself — i.e. without any key predicate,
   * in contrast to the same operation bound to a single entity.
   */
  public getSomething(params: GetSomethingFunctionParams) {
    const { addFullPath, client, isUrlNotEncoded } = this.__base;
    const url = addFullPath(this._qGetSomething.buildUrl(params, isUrlNotEncoded()));

    return new UrlRequestCmd<ODataModelResponseV4<PersonModel>>(client, ODataHttpMethods.Get, url, undefined, {
      mainResponseConverter: new ModelResponseConverterV4(qPersonV4),
    });
  }
}
