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
  testNumber?: number;
  testBinary?: BinaryString;
  testAny?: string;
  multipleStrings?: Array<string>;
  multipleNumbers?: Array<number>;
  multipleBooleans?: Array<boolean>;
}
