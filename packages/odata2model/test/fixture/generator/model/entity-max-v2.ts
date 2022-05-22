export interface Book {
  id: string;
  requiredOption: boolean;
  time: string | null;
  optionalDate: string | null;
  dateTimeOffset: string | null;
  TestDecimal: string | null;
  testInt16: number | null;
  testInt32: number | null;
  testInt64: string | null;
  testSingle: string | null;
  testByte: string | null;
  testSByte: string | null;
  testDouble: string | null;
  testBinary: string | null;
  testAny: string | null;
  multipleIds: Array<string>;
  multipleStrings: Array<string>;
  multipleBooleans: Array<boolean>;
  multipleTimes: Array<string>;
  multipleDateTimes: Array<string>;
  multipleDateTimeOffsets: Array<string>;
  multipleInt16: Array<number>;
  multipleDecimals: Array<string>;
  multipleBinaries: Array<string>;
}
