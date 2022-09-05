export enum Choice {
  A = "A",
  B = "B",
}

export interface Book {
  id: boolean;
  myChoice: Choice;
  otherChoices: Array<Choice>;
}

export type BookId = boolean | { id: boolean };

export interface EditableBook extends Pick<Book, "id" | "myChoice">, Partial<Pick<Book, "otherChoices">> {}
