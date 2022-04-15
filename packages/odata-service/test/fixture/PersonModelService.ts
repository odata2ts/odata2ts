import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeService, CollectionService, EntitySetService, compileId } from "../../src";
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

export const enum Feature {
  Feature1 = "Feature1",
}

export interface PersonModel {
  UserName: string;
  Age: number;
  FavFeature: Feature;
  Features: Array<Feature>;
  Friends: Array<PersonModel>;
  BestFriend?: PersonModel;
}

export class QPerson extends QueryObject {
  public readonly userName = new QStringPath(this.withPrefix("UserName"));
  public readonly age = new QNumberPath(this.withPrefix("Age"));
  public readonly favFeature = new QEnumPath(this.withPrefix("FavFeature"));
  public readonly features = new QCollectionPath(this.withPrefix("Features"), () => QEnumCollection);
  public readonly friends = new QEntityCollectionPath(this.withPrefix("Friends"), () => QPerson);
  public readonly bestFriend = new QEntityPath(this.withPrefix("BestFriend"), () => QPerson);

  constructor(path?: string) {
    super(path);
  }
}

export const qPerson = new QPerson();

export class PersonModelService extends EntityTypeService<PersonModel, QPerson> {
  public get features() {
    return new CollectionService(this.client, this.path + "/Features", new QEnumCollection());
  }

  public get bestFriend() {
    return new PersonModelService(this.client, this.path + "/BestFriend");
  }

  public get friends() {
    return new PersonModelCollectionService(this.client, this.path + "/Friends");
  }

  constructor(client: ODataClient, path: string) {
    super(client, path, new QPerson());
  }
}

export class PersonModelCollectionService extends EntitySetService<
  PersonModel,
  QPerson,
  string | { UserName: string }
> {
  private keySpec = [{ isLiteral: false, name: "userName", odataName: "UserName" }];

  constructor(client: ODataClient, path: string) {
    super(client, path, qPerson);
  }

  public getKeySpec() {
    return this.keySpec;
  }

  public get(id: string | { UserName: string }): PersonModelService {
    const url = compileId(this.path, this.keySpec, id);
    return new PersonModelService(this.client, url);
  }
}
