export interface Book {
  id: string;
  requiredOption: boolean;
  time: string | null;
  optionalDate: string | null;
  dateTimeOffset: string | null;
  TestDecimal: number | null;
  testBinary: string | null;
  testAny: string | null;
  multipleStrings: Array<string>;
  multipleNumbers: Array<number>;
  multipleBooleans: Array<boolean>;
  multipleIds: Array<string>;
  multipleTimes: Array<string>;
  multipleDates: Array<string>;
  multipleDateTimeOffsets: Array<string>;
  multipleBinaries: Array<string>;
}
