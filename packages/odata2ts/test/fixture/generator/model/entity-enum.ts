export enum Choice {
  A = "A",
  B = "B",
  Z = "Z",
}

export interface Book {
  id: boolean;
  myChoice: Choice;
  otherChoices: Array<Choice>;
}
