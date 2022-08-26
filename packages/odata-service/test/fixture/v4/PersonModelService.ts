import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV4, CollectionServiceV4, EntitySetServiceV4 } from "../../../src";
import {
  QCollectionPath,
  QEntityCollectionPath,
  QEnumPath,
  QNumberPath,
  QStringPath,
  QEntityPath,
  QueryObject,
  QEnumCollection,
} from "@odata2ts/odata-query-objects";
import { EditablePersonModel, PersonModel } from "../PersonModel";

export class QPersonV4 extends QueryObject {
  public readonly userName = new QStringPath(this.withPrefix("UserName"));
  public readonly age = new QNumberPath(this.withPrefix("Age"));
  public readonly favFeature = new QEnumPath(this.withPrefix("FavFeature"));
  public readonly features = new QCollectionPath(this.withPrefix("Features"), () => QEnumCollection);
  public readonly friends = new QEntityCollectionPath(this.withPrefix("Friends"), () => QPersonV4);
  public readonly bestFriend = new QEntityPath(this.withPrefix("BestFriend"), () => QPersonV4);

  constructor(path?: string) {
    super(path);
  }
}

export const qPersonV4 = new QPersonV4();

export class PersonModelService<ClientType extends ODataClient> extends EntityTypeServiceV4<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV4
> {
  constructor(client: ODataClient, path: string) {
    super(client, path, new QPersonV4());
  }

  public get features() {
    return new CollectionServiceV4(this.client, this.path + "/Features", new QEnumCollection());
  }

  public get bestFriend() {
    return new PersonModelService(this.client, this.path + "/BestFriend");
  }

  public get friends() {
    return new PersonModelCollectionService(this.client, this.path + "/Friends");
  }
}

export class PersonModelCollectionService<ClientType extends ODataClient> extends EntitySetServiceV4<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV4,
  string | { UserName: string },
  PersonModelService<ClientType>
> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qPersonV4, PersonModelService, [
      { isLiteral: false, type: "string", name: "userName", odataName: "UserName" },
    ]);
  }
}
