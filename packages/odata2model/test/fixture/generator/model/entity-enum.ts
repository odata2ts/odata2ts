export enum Choice {
  A = "A",
  B = "B",
}

export interface Book {
  id: string;
  myChoice: Choice;
  otherChoices: Array<Choice>;
}
