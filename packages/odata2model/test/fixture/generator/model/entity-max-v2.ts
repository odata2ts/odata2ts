export interface Book {
  id: string;
  requiredOption: boolean;
  time: string | null;
  optionalDate: string | null;
  dateTimeOffset: string | null;
  testByte: string | null;
  testSByte: string | null;
  testInt16: number | null;
  testInt32: number | null;
  testInt64: string | null;
  testSingle: string | null;
  testDouble: string | null;
  TestDecimal: string | null;
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

export type BookId = string | { id: string };

export interface EditableBook
  extends Pick<Book, "id" | "requiredOption">,
    Partial<
      Pick<
        Book,
        | "time"
        | "optionalDate"
        | "dateTimeOffset"
        | "testByte"
        | "testSByte"
        | "testInt16"
        | "testInt32"
        | "testInt64"
        | "testSingle"
        | "testDouble"
        | "TestDecimal"
        | "testBinary"
        | "testAny"
        | "multipleIds"
        | "multipleStrings"
        | "multipleBooleans"
        | "multipleTimes"
        | "multipleDateTimes"
        | "multipleDateTimeOffsets"
        | "multipleInt16"
        | "multipleDecimals"
        | "multipleBinaries"
      >
    > {}
