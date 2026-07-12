import { HttpResponseModel } from "@odata2ts/http-client-api";
import {
  ODataCollectionResponseV2,
  ODataCollectionResponseV4,
  ODataComplexModelResponseV2,
  ODataEntityModelResponseV2,
  ODataModelResponseV4,
  ODataValueResponseV2,
  ODataValueResponseV4,
} from "@odata2ts/odata-core";
import { QParamModel } from "../param/QParamModel";
import { QueryObjectModel } from "../QueryObjectModel";
import { ResponseDataConverter } from "./ResponseDataConverter";

export type ExtractDataTypeFromV4ResponseStructure<ResponseStructure> = ResponseStructure extends
  | ODataValueResponseV4<infer T>
  | ODataModelResponseV4<infer T>
  | ODataCollectionResponseV4<infer T>
  ? T
  : never;

export type ExtractDataTypeFromV2ResponseStructure<ResponseStructure> = ResponseStructure extends
  | ODataValueResponseV2<infer T>
  | ODataEntityModelResponseV2<infer T>
  | ODataComplexModelResponseV2<infer T>
  | ODataCollectionResponseV2<infer T>
  ? T
  : never;

export type ExtractDataTypeFromResponseStructure<ResponseStructure> =
  | ExtractDataTypeFromV4ResponseStructure<ResponseStructure>
  | ExtractDataTypeFromV2ResponseStructure<ResponseStructure>;

export abstract class MainResponseConverter<Type, Structure> {
  public constructor(protected converter: ResponseDataConverter<Type>) {}

  public abstract convert(response: HttpResponseModel<any>): HttpResponseModel<Structure>;

  protected applyConverter(value: Type) {
    const qModel = this.converter as QueryObjectModel<any, Type>;
    const qParam = this.converter as QParamModel<any, Type>;

    if (typeof qModel.convertFromOData === "function") {
      return qModel.convertFromOData(value);
    }
    if (typeof qParam.convertFrom === "function") {
      return qParam.convertFrom(value);
    }
  }
}
