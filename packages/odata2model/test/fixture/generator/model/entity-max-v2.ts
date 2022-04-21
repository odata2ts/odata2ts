export interface Book {
  id: string;
  requiredOption: boolean;
  time?: string;
  optionalDate?: string;
  dateTimeOffset?: string;
  TestDecimal?: string;
  testInt16?: number;
  testInt32?: number;
  testInt64?: string;
  testSingle?: string;
  testByte?: string;
  testSByte?: string;
  testDouble?: string;
  testBinary?: string;
  testAny?: string;
  multipleIds?: Array<string>;
  multipleStrings?: Array<string>;
  multipleBooleans?: Array<boolean>;
  multipleTimes?: Array<string>;
  multipleDateTimes?: Array<string>;
  multipleDateTimeOffsets?: Array<string>;
  multipleInt16?: Array<number>;
  multipleDecimals?: Array<string>;
  multipleBinaries?: Array<string>;
}
