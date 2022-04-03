// @ts-nocheck
import type {
  GuidString,
  TimeOfDayString,
  DateString,
  DateTimeOffsetString,
  BinaryString,
} from "@odata2ts/odata-query-objects";

export interface Book {
  id: GuidString;
  isTrue: boolean;
  time?: TimeOfDayString;
  optionalDate?: DateString;
  dateTimeOffset?: DateTimeOffsetString;
  TestInt16?: number;
  TestInt32?: number;
  TestInt64?: number;
  TestDecimal?: number;
  TestDouble?: number;
  testByte?: number;
  testSByte?: number;
  testSingle?: number;
  testBinary?: BinaryString;
  testAny?: string;
}
