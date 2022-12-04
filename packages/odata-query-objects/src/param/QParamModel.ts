import { ParamValueModel } from "@odata2ts/converter-api";

export interface QParamModel<OriginalType, ConvertedType> {
  getName(): string;
  getMappedName(): string;
  convertFrom(value: ParamValueModel<OriginalType>): ParamValueModel<ConvertedType>;
  convertFrom(value: Array<ParamValueModel<OriginalType>>): Array<ParamValueModel<ConvertedType>>;

  convertTo(value: ParamValueModel<ConvertedType>): ParamValueModel<OriginalType>;
  convertTo(value: Array<ParamValueModel<ConvertedType>>): Array<ParamValueModel<OriginalType>>;

  formatUrlValue(value: ParamValueModel<ConvertedType> | Array<ParamValueModel<ConvertedType>>): string | undefined;
  parseUrlValue(value: string | undefined): ParamValueModel<ConvertedType> | Array<ParamValueModel<ConvertedType>>;
}
