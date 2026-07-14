import { FlexibleConversionModel, ResponseDataConverter } from "../../../src";

export const SampleResponseConverter: ResponseDataConverter<string> = {
  convertFrom(value: FlexibleConversionModel<any>): FlexibleConversionModel<string> {
    return String(value).toUpperCase();
  },
};
