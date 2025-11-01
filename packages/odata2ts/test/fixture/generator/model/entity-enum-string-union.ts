export type Choice = "A" | "B" | "Z";

export interface Book {
  id: boolean;
  myChoice: Choice;
  otherChoices: Array<Choice>;
}
