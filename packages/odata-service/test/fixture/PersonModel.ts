import {
  EnumCollection,
  NumericEnumCollection,
  QEnumCollection,
  QNumericEnumCollection,
  QStringCollection,
  QStringV2Collection,
  StringCollection,
} from "@odata2ts/odata-query-objects";
import { PrefixModel } from "@odata2ts/test-converters";
import { CollectionServiceV2, CollectionServiceV4, ODataServiceOptions } from "../../src";
import { MockClient } from "../mock/MockClient";
import { NumericTestEnum } from "../v2/CollectionServiceV2.test";
import { StringTestEnum } from "../v4/CollectionServiceV4.test";
import {
  PersonModelV2CollectionService as PMCServiceV2,
  PersonModelV2Service as PMServiceV2,
} from "./v2/PersonModelV2Service";
import {
  PersonModelCollectionService as PMCServiceV4,
  PersonModelService as PMServiceV4,
} from "./v4/PersonModelService";

export enum Feature {
  Feature1 = "Feature1",
  Feature2 = "Feature2",
}

export interface PersonModel {
  userName: string;
  Age: string;
  FavFeature: Feature;
  Features: Array<Feature>;
  Friends: Array<PersonModel>;
  BestFriend?: PersonModel;
}

export interface EditablePersonModel extends Pick<PersonModel, "userName" | "Age" | "FavFeature" | "Features"> {}

export type PersonId = string | { userName: string };

export interface GetSomethingFunctionParams {
  testGuid: PrefixModel;
  testDateTime: string;
  testDateTimeO: string;
  testTime: string;
}

export type PersonModelServiceVersion = PMServiceV2<MockClient> | PMServiceV4<MockClient>;
export type PersonCollectionServiceVersion = PMCServiceV2<MockClient> | PMCServiceV4<MockClient>;

export type StringCollectionServiceConstructor = (
  basePath: string,
  name: string,
  options?: ODataServiceOptions,
) => StringCollectionService;
export type StringCollectionService =
  | CollectionServiceV4<MockClient, StringCollection, QStringCollection>
  | CollectionServiceV2<MockClient, StringCollection, QStringV2Collection>;

export type EnumCollectionServiceConstructor = (basePath: string, name: string) => EnumCollectionService;
export type EnumCollectionService =
  | CollectionServiceV4<MockClient, EnumCollection<StringTestEnum>, QEnumCollection<any>>
  | CollectionServiceV2<MockClient, NumericEnumCollection<NumericTestEnum>, QNumericEnumCollection<any>>;
