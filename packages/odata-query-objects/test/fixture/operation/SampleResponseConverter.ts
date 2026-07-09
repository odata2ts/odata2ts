import { FlexibleConversionModel, ResponseDataConverter } from "@odata2ts/odata-query-objects";

export interface SampleResponseStructure {
  value: number;
}

export class SampleResponseConverter implements ResponseDataConverter<any, string> {
  convertFrom(value: any): FlexibleConversionModel<string> {
    return `Hey! This was the value: ${value}`;
  }
}
