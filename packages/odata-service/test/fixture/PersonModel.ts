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
import { ODataClient } from "@odata2ts/odata-client-api";

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

export type PersonModelServiceVersion = PMServiceV2 | PMServiceV4;
export type PersonCollectionServiceVersion = PMCServiceV2 | PMCServiceV4;

export type StringCollectionServiceConstructor = (url: string) => StringCollectionService;
export type StringCollectionService =
  | CollectionServiceV4<StringCollection, QStringCollection>
  | CollectionServiceV2<StringCollection, QStringV2Collection>;

export type EnumCollectionServiceConstructor = (url: string) => EnumCollectionService;
export type EnumCollectionService =
  | CollectionServiceV4<EnumCollection<Feature>, QEnumCollection>
  | CollectionServiceV2<EnumCollection<Feature>, QEnumCollection>;
