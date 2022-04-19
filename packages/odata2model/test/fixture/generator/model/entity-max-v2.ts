// @ts-nocheck
import type {
  GuidString,
  TimeString,
  DateTimeString,
  DateTimeOffsetString,
  BinaryString,
} from "@odata2ts/odata-query-objects";

export interface Book {
  id: GuidString;
  requiredOption: boolean;
  time?: TimeString;
  optionalDate?: DateTimeString;
  dateTimeOffset?: DateTimeOffsetString;
  TestDecimal?: string;
  testNumber?: number;
  testBinary?: BinaryString;
  testAny?: string;
  multipleStrings?: Array<string>;
  multipleNumbers?: Array<number>;
  multipleBooleans?: Array<boolean>;
}
