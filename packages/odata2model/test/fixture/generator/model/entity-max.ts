export interface Book {
  id: string;
  requiredOption: boolean;
  time?: string;
  optionalDate?: string;
  dateTimeOffset?: string;
  TestDecimal?: number;
  testBinary?: string;
  testAny?: string;
  multipleStrings?: Array<string>;
  multipleNumbers?: Array<number>;
  multipleBooleans?: Array<boolean>;
  multipleIds?: Array<string>;
  multipleTimes?: Array<string>;
  multipleDates?: Array<string>;
  multipleDateTimeOffsets?: Array<string>;
  multipleBinaries?: Array<string>;
}
