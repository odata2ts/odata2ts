import { ODataClient } from "@odata2ts/odata-client-api";
import { QEnumCollection } from "@odata2ts/odata-query-objects";

import { CollectionServiceV4, EntitySetServiceV4, EntityTypeServiceV4 } from "../../../src";
import { EditablePersonModel, PersonId, PersonModel } from "../PersonModel";
import { QPersonIdFunction } from "../QPerson";
import { QPersonV4, qPersonV4 } from "./QPersonV4";

export class PersonModelService<ClientType extends ODataClient> extends EntityTypeServiceV4<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV4
> {
  constructor(client: ODataClient, basePath: string, name: string) {
    super(client, basePath, name, new QPersonV4());
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
}

export class PersonModelCollectionService<ClientType extends ODataClient> extends EntitySetServiceV4<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV4,
  PersonId,
  PersonModelService<ClientType>
> {
  constructor(client: ODataClient, basePath: string, name: string) {
    super(client, basePath, name, qPersonV4, PersonModelService, new QPersonIdFunction(name));
  }
}
