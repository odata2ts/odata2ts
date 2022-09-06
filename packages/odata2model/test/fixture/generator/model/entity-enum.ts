export enum Choice {
  A = "A",
  B = "B",
}

export interface Book {
  id: boolean;
  myChoice: Choice;
  otherChoices: Array<Choice>;
}
