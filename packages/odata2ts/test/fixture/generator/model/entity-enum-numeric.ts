export enum Choice {
  A = 1,
  B = 2,
  Z = 99,
}

export interface Book {
  id: boolean;
  myChoice: Choice;
  otherChoices: Array<Choice>;
}
