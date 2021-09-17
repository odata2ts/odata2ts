import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeService, CollectionService, EntitySetService, compileId } from "../../src";
import {
  QCollectionPath,
  QEntityCollectionPath,
  QEntityModel,
  qEnumCollection,
  QEnumPath,
  QNumberPath,
  QStringPath,
  QEntityPath,
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

const qPerson: QEntityModel<PersonModel, Feature> = {
  userName: new QStringPath("UserName"),
  age: new QNumberPath("Age"),
  favFeature: new QEnumPath("FavFeature"),
  features: new QCollectionPath("Features", () => qEnumCollection),
  friends: new QEntityCollectionPath("Friends", () => qPerson),
  bestFriend: new QEntityPath("BestFriend", () => qPerson),
};

export class PersonModelService extends EntityTypeService<PersonModel> {
  public get features() {
    return new CollectionService(this.client, this.path + "/Features", qEnumCollection);
  }

  public get bestFriend() {
    return new PersonModelService(this.client, this.path + "/BestFriend");
  }

  public get friends() {
    return new PersonModelCollectionService(this.client, this.path + "/Friends");
  }

  constructor(client: ODataClient, path: string) {
    super(client, path, qPerson);
  }
}

export class PersonModelCollectionService extends EntitySetService<PersonModel, string | { UserName: string }> {
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
