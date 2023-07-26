import { ODataHttpClient, ODataHttpClientConfig } from "@odata2ts/http-client-api";
import { QEnumCollection } from "@odata2ts/odata-query-objects";

import { CollectionServiceV4, EntitySetServiceV4, EntityTypeServiceV4 } from "../../../src";
import { EditablePersonModel, GetSomethingFunctionParams, PersonId, PersonModel } from "../PersonModel";
import { QPersonIdFunction } from "../QPerson";
import { QGetSomethingFunction, QPersonV4, qPersonV4 } from "./QPersonV4";

export class PersonModelService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV4
> {
  private __qGetSomething = new QGetSomethingFunction();

  constructor(client: ODataHttpClient, basePath: string, name: string, bigNumbersAsString?: boolean) {
    super(client, basePath, name, new QPersonV4(), bigNumbersAsString);
  }

  public get features() {
    return new CollectionServiceV4(this.client, this.getPath(), "Features", new QEnumCollection());
  }

  public get bestFriend() {
    return new PersonModelService(this.client, this.getPath(), "BestFriend");
  }

  public get friends() {
    return new PersonModelCollectionService(this.client, this.getPath(), "Friends");
  }

  public getSomething(params: GetSomethingFunctionParams, requestConfig?: ODataHttpClientConfig<ClientType>) {
    const url = this.addFullPath(this.__qGetSomething.buildUrl(params));
    return this.client.get(url, requestConfig);
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
