import {
  PersonModelCollectionService as PMCServiceV2,
  PersonModelService as PMServiceV2,
} from "./v2/PersonModelService";
import {
  PersonModelCollectionService as PMCServiceV4,
  PersonModelService as PMServiceV4,
} from "./v4/PersonModelService";
import { CollectionServiceV2, CollectionServiceV4 } from "../../src";
import {
  EnumCollection,
  QEnumCollection,
  QStringCollection,
  QStringV2Collection,
  StringCollection,
} from "@odata2ts/odata-query-objects";
import { MockODataClient } from "../mock/MockODataClient";

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

export interface EditablePersonModel extends Pick<PersonModel, "UserName" | "Age" | "FavFeature" | "Features"> {}

export type PersonModelServiceVersion = PMServiceV2<MockODataClient> | PMServiceV4<MockODataClient>;
export type PersonCollectionServiceVersion = PMCServiceV2<MockODataClient> | PMCServiceV4<MockODataClient>;

export type StringCollectionServiceConstructor = (url: string) => StringCollectionService;
export type StringCollectionService =
  | CollectionServiceV4<MockODataClient, StringCollection, QStringCollection>
  | CollectionServiceV2<MockODataClient, StringCollection, QStringV2Collection>;

export type EnumCollectionServiceConstructor = (url: string) => EnumCollectionService;
export type EnumCollectionService =
  | CollectionServiceV4<MockODataClient, EnumCollection<Feature>, QEnumCollection>
  | CollectionServiceV2<MockODataClient, EnumCollection<Feature>, QEnumCollection>;
