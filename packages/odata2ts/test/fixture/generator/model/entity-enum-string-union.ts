export type Choice = "A" | "B" | "Z";

export const Choice = ["A", "B", "Z"] as const;

export interface Book {
  id: boolean;
  myChoice: Choice;
  otherChoices: Array<Choice>;
}
