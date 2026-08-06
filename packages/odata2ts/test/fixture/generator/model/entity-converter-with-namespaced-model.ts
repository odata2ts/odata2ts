import type { Nested } from "@odata2ts/test-converters";

export interface Book {
  id: boolean;
  optional: Nested.Model | null;
}
