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

export type BookId = string | { id: string };

export interface EditableBook
  extends Pick<Book, "id" | "requiredOption">,
    Partial<
      Pick<
        Book,
        | "time"
        | "optionalDate"
        | "dateTimeOffset"
        | "TestDecimal"
        | "testBinary"
        | "testAny"
        | "multipleStrings"
        | "multipleNumbers"
        | "multipleBooleans"
        | "multipleIds"
        | "multipleTimes"
        | "multipleDates"
        | "multipleDateTimeOffsets"
        | "multipleBinaries"
      >
    > {}
