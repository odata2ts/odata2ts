export enum Choice {
  A = 1,
  B = 2,
}

export interface Book {
  id: boolean;
  myChoice: Choice;
  otherChoices: Array<Choice>;
}
