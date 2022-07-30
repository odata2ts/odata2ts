import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV2, EntitySetServiceV2, CollectionServiceV2 } from "../../../src";
import {
  QCollectionPath,
  QEntityCollectionPath,
  QEnumPath,
  QNumberPath,
  QEntityPath,
  QueryObject,
  QEnumCollection,
  QStringV2Path,
} from "@odata2ts/odata-query-objects";
import { EditablePersonModel, PersonModel } from "../PersonModel";

export class QPersonV2 extends QueryObject {
  public readonly userName = new QStringV2Path(this.withPrefix("UserName"));
  public readonly age = new QNumberPath(this.withPrefix("Age"));
  public readonly favFeature = new QEnumPath(this.withPrefix("FavFeature"));
  public readonly features = new QCollectionPath(this.withPrefix("Features"), () => QEnumCollection);
  public readonly friends = new QEntityCollectionPath(this.withPrefix("Friends"), () => QPersonV2);
  public readonly bestFriend = new QEntityPath(this.withPrefix("BestFriend"), () => QPersonV2);

  constructor(path?: string) {
    super(path);
  }
}

export const qPersonV2 = new QPersonV2();

export class PersonModelService extends EntityTypeServiceV2<PersonModel, EditablePersonModel, QPersonV2> {
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
}

export class PersonModelCollectionService extends EntitySetServiceV2<
  PersonModel,
  EditablePersonModel,
  QPersonV2,
  string | { UserName: string },
  PersonModelService
> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qPersonV2, PersonModelService, [{ isLiteral: false, name: "userName", odataName: "UserName" }]);
  }
}
