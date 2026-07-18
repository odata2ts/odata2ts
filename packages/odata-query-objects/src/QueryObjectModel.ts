import { ParamValueModel } from "@odata2ts/converter-api";

export type FlexibleConversionModel<T> = ParamValueModel<T> | Array<ParamValueModel<T>>;

export interface QueryObjectModel<T = any> {
  convertFromOData(odataModel: FlexibleConversionModel<any>): FlexibleConversionModel<T>;
  convertToOData(userModel: FlexibleConversionModel<T>): FlexibleConversionModel<any>;
}
