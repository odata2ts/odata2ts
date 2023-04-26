import { ODataClient, ODataClientConfig } from "@odata2ts/odata-client-api";
import { QEnumCollection } from "@odata2ts/odata-query-objects";

import { CollectionServiceV2, EntitySetServiceV2, EntityTypeServiceV2 } from "../../../src";
import { EditablePersonModel, GetSomethingFunctionParams, PersonId, PersonModel } from "../PersonModel";
import { QPersonIdFunction } from "../QPerson";
import { QGetSomethingFunction, QPersonV2, qPersonV2 } from "./QPersonV2";

export class PersonModelV2Service<ClientType extends ODataClient> extends EntityTypeServiceV2<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV2
> {
  private __qGetSomething = new QGetSomethingFunction();

  public get features() {
    return new CollectionServiceV2(this.client, this.basePath, "Features", new QEnumCollection());
  }

  public get bestFriend() {
    return new PersonModelV2Service(this.client, this.basePath, "BestFriend");
  }

  public get friends() {
    return new PersonModelV2CollectionService(this.client, this.basePath, "Friends");
  }

  constructor(client: ODataClient, basePath: string, name: string) {
    super(client, basePath, name, new QPersonV2());
  }

  public getSomething(params: GetSomethingFunctionParams, requestConfig?: ODataClientConfig<ClientType>) {
    const url = this.addFullPath(this.__qGetSomething.buildUrl(params));
    return this.client.get(url, requestConfig);
  }
}

export class PersonModelV2CollectionService<ClientType extends ODataClient> extends EntitySetServiceV2<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV2,
  PersonId
> {
  constructor(client: ODataClient, basePath: string, name: string) {
    super(client, basePath, name, qPersonV2, new QPersonIdFunction(name));
  }
}
