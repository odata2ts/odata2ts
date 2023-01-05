export interface Book {
  id: string;
  id2: number;
  id3: boolean;
  truth: boolean;
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
  testDecimal: string | null;
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

export type BookId = { id: string; id2: number; id3: boolean };

export interface EditableBook
  extends Pick<Book, "id3" | "truth">,
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
        | "testDecimal"
        | "testBinary"
        | "testAny"
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
