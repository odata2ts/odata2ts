export interface Book {
  id: boolean;
  test: boolean | null;
}

export type BookId = boolean | { id: boolean };

export interface EditableBook extends Partial<Pick<Book, "test">> {}

export interface NothingToAdd extends Book {}

export interface EditableNothingToAdd extends Partial<Pick<NothingToAdd, "test">> {}

export interface WithOwnStuff extends Book {
  id2: boolean;
  test2: boolean | null;
}

export type WithOwnStuffId = { id: boolean; id2: boolean };

export interface EditableWithOwnStuff
  extends Pick<WithOwnStuff, "id" | "id2">,
    Partial<Pick<WithOwnStuff, "test" | "test2">> {}
