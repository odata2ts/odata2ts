export interface Book {
  id: number;
  testBoolean: boolean;
  testTime: string | null;
  testDate: string | null;
  testDateTimeOffset: string | null;
  testString: string | null;
  testAny: string | null;
  multipleIds: Array<string>;
  multipleStrings: Array<string>;
}
