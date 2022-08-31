import { ODataClient, ODataClientConfig } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV2, EntitySetServiceV2, CollectionServiceV2 } from "../../../src";
import {
  QEnumCollection,
} from "@odata2ts/odata-query-objects";
import {EditablePersonModel, GetSomethingFunctionParams, PersonId, PersonModel} from "../PersonModel";
import {QGetSomethingFunction, qPersonV2, QPersonV2} from "./QPersonV2";
import {QPersonIdFunction} from "../QPerson";


export class PersonModelService<ClientType extends ODataClient> extends EntityTypeServiceV2<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV2
> {
  private qGetSomething = new QGetSomethingFunction(this.path);

  public get features() {
    return new CollectionServiceV2(this.client, this.path + "/Features", new QEnumCollection());
  }

  public get bestFriend() {
    return new PersonModelService(this.client, this.path + "/BestFriend");
  }

  public get friends() {
    return new PersonModelCollectionService(this.client, this.path + "/Friends");
  }

  constructor(client: ODataClient, path: string) {
    super(client, path, new QPersonV2());
  }

  public getSomething(
    params: GetSomethingFunctionParams,
    requestConfig?: ODataClientConfig<ClientType>
  ) {
    const url = this.qGetSomething.buildUrl(params);
    return this.client.get(url, requestConfig);
  }
}

export class PersonModelCollectionService<ClientType extends ODataClient> extends EntitySetServiceV2<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV2,
  PersonId,
  PersonModelService<ClientType>
> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qPersonV2, PersonModelService, new QPersonIdFunction(path));
  }
}
