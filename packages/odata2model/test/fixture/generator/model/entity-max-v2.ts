import type {
  GuidString,
  TimeV2String,
  DateTimeV2String,
  DateTimeOffsetV2String,
  BinaryString,
} from "@odata2ts/odata-query-objects";

export interface Book {
  id: GuidString;
  requiredOption: boolean;
  time?: TimeV2String;
  optionalDate?: DateTimeV2String;
  dateTimeOffset?: DateTimeOffsetV2String;
  TestDecimal?: string;
  testInt16?: number;
  testInt32?: number;
  testInt64?: string;
  testSingle?: string;
  testByte?: string;
  testSByte?: string;
  testDouble?: string;
  testBinary?: BinaryString;
  testAny?: string;
  multipleIds?: Array<GuidString>;
  multipleStrings?: Array<string>;
  multipleBooleans?: Array<boolean>;
  multipleTimes?: Array<TimeV2String>;
  multipleDateTimes?: Array<DateTimeV2String>;
  multipleDateTimeOffsets?: Array<DateTimeOffsetV2String>;
  multipleInt16?: Array<number>;
  multipleDecimals?: Array<string>;
  multipleBinaries?: Array<BinaryString>;
}
