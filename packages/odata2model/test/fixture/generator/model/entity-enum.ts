import type { GuidString } from "@odata2ts/odata-query-objects";

export enum Choice {
  A = "A",
  B = "B",
}

export interface Book {
  id: GuidString;
  myChoice: Choice;
  otherChoices?: Array<Choice>;
}
