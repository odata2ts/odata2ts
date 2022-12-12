export interface Book {
  id: string;
  id2: number;
  id3: boolean;
  truth: boolean;
  time: string | null;
  optionalDate: string | null;
  dateTimeOffset: string | null;
  testDecimal: number | null;
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

export type BookId = { id: string; id2: number; id3: boolean };

export interface EditableBook
  extends Pick<Book, "id3" | "truth">,
    Partial<
      Pick<
        Book,
        | "time"
        | "optionalDate"
        | "dateTimeOffset"
        | "testDecimal"
        | "testBinary"
        | "testAny"
        | "multipleStrings"
        | "multipleNumbers"
        | "multipleBooleans"
        | "multipleTimes"
        | "multipleDates"
        | "multipleDateTimeOffsets"
        | "multipleBinaries"
      >
    > {}
