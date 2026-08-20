export enum Choice {
  A = "A",
  B = "B",
}

export interface parent {
  parentId: boolean;
}

export type parentId = boolean | { parentId: boolean };

export interface Editableparent extends Partial<Pick<parent, "parentId">> {}

export interface Book extends parent {
  id: boolean;
  my_Choice: Choice;
  Address: LOCATION | null;
}

export type BookId = { parentId: boolean; id: boolean };

export interface EditableBook extends Pick<Book, "my_Choice">, Partial<Pick<Book, "parentId" | "id">> {
  Address?: EditableLOCATION | null;
}

export interface LOCATION {
  TEST: boolean | null;
}

export interface EditableLOCATION extends Partial<Pick<LOCATION, "TEST">> {}
