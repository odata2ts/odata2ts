import { ODataResponse } from "@odata2ts/odata-client-api";

export interface EntityKeySpec {
  isLiteral: boolean;
  name: string;
  odataName: string;
}

export interface EntitySetService<KeySpec> {
  getKeySpec: () => [EntityKeySpec];

  create: <CreateModel, ResponseModel>(model: CreateModel) => ODataResponse<ResponseModel>;

  get: <S>(id: KeySpec) => S;
}

export interface EntityTypeService {}
