export enum Choice {
  A = "A",
  B = "B",
}

export interface Book {
  id: number;
  myChoice: Choice;
  otherChoices?: Array<Choice>;
}
