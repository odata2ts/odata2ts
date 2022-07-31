import { ODataResponse } from "@odata2ts/odata-client-api";
import { EntityKeySpec } from "./EntityModel";

export interface ParsedKey<KeySpec = {}> {
  path: string | undefined;
  keys: KeySpec;
}

export interface EntitySetService<KeySpec> {
  getKeySpec: () => EntityKeySpec;

  createKey(id: KeySpec): string;

  parseKey(keyPath: string): ParsedKey<KeySpec>;

  create: <CreateModel, ResponseModel>(model: CreateModel) => ODataResponse<ResponseModel>;

  get: <S>(id: KeySpec) => S;
}

export interface EntityTypeService {}
