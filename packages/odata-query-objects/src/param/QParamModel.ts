import { ParamValueModel } from "@odata2ts/converter-api";

export type FlexibleConversionModel<T> = ParamValueModel<T> | Array<ParamValueModel<T>>;

export interface QParamModel<OriginalType, ConvertedType> {
  getName(): string;
  getMappedName(): string;

  convertFrom(value: FlexibleConversionModel<OriginalType>): FlexibleConversionModel<ConvertedType>;
  convertTo(value: FlexibleConversionModel<ConvertedType>): FlexibleConversionModel<OriginalType>;

  formatUrlValue(value: FlexibleConversionModel<ConvertedType>): string | undefined;
  parseUrlValue(value: string | undefined): FlexibleConversionModel<ConvertedType>;
}
