import { PrefixModel } from "@odata2ts/test-converters";

export interface Book {
  id: boolean;
  optional: PrefixModel | null;
}
